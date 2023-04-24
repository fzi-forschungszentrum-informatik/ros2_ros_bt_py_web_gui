import { Component, createRef, Fragment } from "react";
import { DocumentedNode, NodeData, NodeDataWiring, NodeMsg, TreeMsg } from "../types/types";
import * as d3 from "d3";
import ROSLIB from "roslib";
import { treeIsEditable, prettyprint_type, selectIOGripper, getDist } from "../utils";
import { MultipleSelection } from "./MultipleSelection";
import { NewNode } from "./NewNode";
import { WireNodeDataRequest, WireNodeDataResponse } from "../types/services/WireNodeData";
import { MoveNodeRequest, MoveNodeResponse } from "../types/services/MoveNode";
import { AddNodeAtIndexRequest, AddNodeAtIndexResponse } from "../types/services/AddNodeAtIndex";
import { ReplaceNodeRequest, ReplaceNodeResponse } from "../types/services/ReplaceNode";
import { ZoomBehavior } from "d3";
import { flextree } from "d3-flextree";

interface D3BehaviorTreeEditorProps {
    ros: ROSLIB.Ros
    bt_namespace: string,
    tree_message: TreeMsg | null,
    subtree_names: string[],
    publishing_subtrees: boolean,
    dragging_node_list_item: DocumentedNode | null,
    onSelectionChange: (new_selected_node_name: string | null) => void,
    onMultipleSelectionChange: (new_selected_node_names: string[] | null) => void,
    selectedNodeNames: string[],
    onSelectedEdgeChange: (new_selected_edge: any) => void,
    showDataGraph: boolean,
    onSelectedTreeChange: (is_subtree: boolean, name: string) => void,
    onNodeListDragging: (dragging: DocumentedNode | null) => void,
    onError: (error_message: string) => void,
    skin: string
}

interface D3BehaviorTreeEditorState {

}

interface TrimmedNodeData {
    key: string,
    serialized_type: string
}

interface TrimmedNode {
    node_class: string,
    module: string,
    state: string,
    max_children: number,
    name: string,
    child_names: string[],
    inputs: TrimmedNodeData[],
    outputs: TrimmedNodeData[],
    options: TrimmedNodeData[]
}

export class D3BehaviorTreeEditor extends Component<D3BehaviorTreeEditorProps, D3BehaviorTreeEditorState> {
    spacing: number;
    min_node_drag_distance: number;
    io_gripper_spacing: number;
    io_gripper_size: number;
    max_io_gripper_size: number;
    nextWiringSource: null;
    nextWiringTarget: null;
    draggedNode: {
        startCoords: [number, number],
        domObject: SVGForeignObjectElement,
        data: d3.HierarchyNode<TrimmedNode>
    };
    dragging: boolean;
    zoomObject?: ZoomBehavior<SVGSVGElement, unknown>;
    dragPanBoundary: number;
    panIntervalID: null;
    panDirection: number[];
    panRate: number;
    panPerFrame: number;
    wire_service: ROSLIB.Service<WireNodeDataRequest, WireNodeDataResponse>;
    unwire_service: ROSLIB.Service<WireNodeDataRequest, WireNodeDataResponse>;
    move_service: ROSLIB.Service<MoveNodeRequest, MoveNodeResponse>;
    replace_service: ROSLIB.Service<ReplaceNodeRequest, ReplaceNodeResponse>;
    add_node_at_index_service: ROSLIB.Service<AddNodeAtIndexRequest, AddNodeAtIndexResponse>;
    svg_ref: React.RefObject<SVGGElement>;
    viewport_ref: React.RefObject<SVGSVGElement>;
    nodeDropTarget: any;
    selection: boolean;
    mouse_moved: boolean;
    start_y?: number;
    start_x?: number;
    parentNode: any;
    dragStartPos: [number, number];
    constructor(props: D3BehaviorTreeEditorProps) {
        super(props);

        this.spacing = 80;

        this.min_node_drag_distance = 15;

        this.io_gripper_spacing = 10;
        this.io_gripper_size = 15;
        this.max_io_gripper_size = 15;

        this.nextWiringSource = null;
        this.nextWiringTarget = null;

        this.draggedNode = null;
        this.dragging = false;

        // ### Pan and zoom stuff ###
        // Begin panning if the mouse is less than this away from the
        // viewport's edge
        this.dragPanBoundary = 50;
        this.panIntervalID = null;
        this.panDirection = [0.0, 0.0];
        this.panRate = 30;
        this.panPerFrame = 10.0;

        this.wire_service = new ROSLIB.Service({
            ros: props.ros,
            name: props.bt_namespace + 'wire_data',
            serviceType: 'ros_bt_py_msgs/WireNodeData'
        });

        this.unwire_service = new ROSLIB.Service({
            ros: props.ros,
            name: props.bt_namespace + 'unwire_data',
            serviceType: 'ros_bt_py_msgs/UnwireNodeData'
        });

        this.move_service = new ROSLIB.Service({
            ros: props.ros,
            name: props.bt_namespace + 'move_node',
            serviceType: 'ros_bt_py_msgs/MoveNode'
        });

        this.replace_service = new ROSLIB.Service({
            ros: props.ros,
            name: props.bt_namespace + 'replace_node',
            serviceType: 'ros_bt_py_msgs/ReplaceNode'
        });

        this.add_node_at_index_service = new ROSLIB.Service({
            ros: props.ros,
            name: props.bt_namespace + 'add_node_at_index',
            serviceType: 'ros_bt_py_msgs/AddNodeAtIndex'
        });

        this.svg_ref = createRef();
        this.viewport_ref = createRef();

        this.dragPanTimerHandler = this.dragPanTimerHandler.bind(this);
        this.resetView = this.resetView.bind(this);
        this.getIOCoords = this.getIOCoords.bind(this);
        this.getIOCoordsFromNode = this.getIOCoordsFromNode.bind(this);
    }

    componentDidMount() {
        // Give Viewport pan / zoom
        var viewport = d3.select<SVGSVGElement, any>(this.viewport_ref.current!);
        var width = viewport.node()!.getBoundingClientRect().width;
        var height = viewport.node()!.getBoundingClientRect().height;
        var viewport_x = viewport.node()!.getBoundingClientRect().x;
        var viewport_y = viewport.node()!.getBoundingClientRect().y;

        viewport
            .on("mouseup", () => {
                console.log("mouseup before zoom");
            });

        this.zoomObject = d3.zoom<SVGSVGElement, any>();
        var container = d3.select(this.svg_ref.current!);

        this.zoomObject.filter(function () {
            return !d3.event.shiftKey
        });

        // SVG MOUSEUP FOR NODE DRAG/DROP
        var svg_viewport = d3.select(this.svg_ref.current!);
        svg_viewport.on("mouseup", () => {
            var new_node = null;
            var msg: NodeMsg | null = null;
            if (this.props.dragging_node_list_item) {
                new_node = new NewNode({ node: this.props.dragging_node_list_item });
                msg = new_node.buildNodeMessage();

                this.props.onNodeListDragging(null);
            }

            if (msg) {
                var parent_name = '';
                var position = -1;
                if (this.nodeDropTarget && this.nodeDropTarget.data) {
                    if (this.nodeDropTarget.data.name === "__forest_root") {
                        this.nodeDropTarget.data.name = "";
                    } else {
                        position = this.nodeDropTarget.position;
                    }
                    parent_name = this.nodeDropTarget.data.name;
                }
                this.add_node_at_index_service.callService(
                    {
                        parent_name: parent_name,
                        node: msg,
                        allow_rename: true,
                        new_child_index: position
                    } as AddNodeAtIndexRequest,
                    (response) => {
                        if (response.success) {
                            console.log('Added node to tree as ' + response.actual_node_name);
                        }
                        else {
                            this.props.onError('Failed to add node ' + msg.name + ': '
                                + response.error_message);
                        }
                    });
            }
        })

        viewport
            .call(
                this.zoomObject
                    .scaleExtent([0.3, 1.0])
                    .on("zoom", () => {
                        container.attr("transform", d3.event.transform);
                    }
                    )
            )
            .call(this.zoomObject.translateTo, 0.0, (height * 0.5) - 10.0);

        // Add Mousemove listener to pan viewport while draggins
        viewport.on("mousemove.pan_if_drag", this.canvasMousemovePanHandler.bind(this));
        viewport
            .on("click", () => {
                // Deselect any selected node if the user clicks on the background and does not perform multi-selection right now
                if (!d3.event.shiftKey) {
                    this.props.onSelectionChange(null);
                    this.props.onSelectedEdgeChange(null);
                }
            });

        // multi selection
        this.selection = false;
        this.mouse_moved = false;

        this.start_y = 0;

        // selection rectangle
        viewport.append("rect")
            .attr("class", "selection")
            .attr("width", 0)
            .attr("height", 0)
            .attr("x", 0)
            .attr("y", 0);

        // start the selection
        viewport
            .on("mousedown", () => {
                if (d3.event.shiftKey) {
                    this.selection = true; // indicates a shift-mousedown enabled selection rectangle

                    var s = viewport.select("rect.selection");

                    if (!s.empty()) {
                        s.attr("x", d3.event.pageX - viewport_x)
                            .attr("y", d3.event.pageY - viewport_y);
                        this.start_x = parseInt(s.attr("x"));
                        this.start_y = parseInt(s.attr("y"));
                    }
                }
            });

        // show the selection rectangle on mousemove
        viewport
            .on("mousemove", () => {
                if (d3.event.shiftKey && this.selection) {
                    this.mouse_moved = true;

                    var s = viewport.select("rect.selection");

                    if (!s.empty()) {
                        var start_x = this.start_x!;
                        var start_y = this.start_y!;
                        var end_x = d3.event.pageX! - viewport_x;
                        var end_y = d3.event.pageY! - viewport_y;

                        // flip the selection rectangle if the user moves in a negative direction from the start point
                        if (d3.event.pageX - viewport_x < start_x) {
                            start_x = d3.event.pageX - viewport_x;
                            end_x = this.start_x!;
                            s.attr("x", start_x);
                        }

                        if (d3.event.pageY - viewport_y < start_y) {
                            start_y = d3.event.pageY - viewport_y;
                            end_y = this.start_y!;
                            s.attr("y", start_y);
                        }

                        s.attr("width", end_x - start_x)
                            .attr("height", Math.abs(end_y - start_y));

                        viewport.selectAll<d3.BaseType, SVGForeignObjectElement>('foreignObject').each(function (data, i) {
                            var bbox = data.getBoundingClientRect();
                            var x = bbox.x - viewport_x;
                            var y = bbox.y - viewport_y;

                            if (x >= start_x && x + bbox.width <= end_x && y >= start_y && y + bbox.height <= end_y) {
                                d3.select(this).select("body").classed('node-selected', true);
                            } else {
                                d3.select(this).select("body").classed('node-selected', false);
                            }
                        });
                    }
                }
            });

        // detect the selected nodes on mouseup
        viewport
            .on("mouseup", () => {
                if (this.selection && this.mouse_moved) {
                    this.selection = false; // hide the selection rectangle
                    this.mouse_moved = false;
                    var s = viewport.select("rect.selection");
                    s.attr("width", 0)
                        .attr("height", 0);

                    var selected_node_names: Set<string> = new Set();

                    viewport.selectAll<SVGForeignObjectElement, d3.HierarchyNode<TrimmedNode>>('foreignObject').each(function (data, i) {
                        if (d3.select(this).select("body").classed('node-selected')) {
                            selected_node_names.add(data.id!);
                        }
                    });

                    this.props.onMultipleSelectionChange(Array.from(selected_node_names));
                }
            });
    }

    render() {
        var editor_classes = "reactive-svg " + this.props.skin;
        return (
            <svg id="editor_viewport"
                ref={this.viewport_ref}
                className={editor_classes}>
                <g id="container" ref={this.svg_ref}>
                    { // order is important here - SVG draws things in the order
                        // they appear in the markup!
                    }
                    <g className="edges" />
                    <g className="vertices" />
                    { // Data Graph should be above the node graph
                        // (since it can be toggled on and off)
                    }
                    <g className="data_graph">
                        { // We want the edges below the vertices here because that looks nicer
                        }
                        <g className="data_edges" />
                        <g className="data_vertices" />
                    </g>
                    { // This is for the targets that appear when the user is dragging
                        // a node to reposition it.
                        // Obviously, these should be above anything else!
                    }
                    <g className="drop_targets"
                        visibility="hidden" />
                </g>
                <text x="10"
                    y="20"
                    fill="#FFFFFF"
                    text-anchor="left"
                    alignment-baseline="top"
                    className="cursor-pointer svg-button"
                    onClick={this.resetView}>
                    Reset View
                </text>

            </svg>
        );
    }

    componentDidUpdate(prevProps: D3BehaviorTreeEditorProps, prevState: D3BehaviorTreeEditorState) {
        if (this.props.tree_message !== prevProps.tree_message && this.props.tree_message !== null) {
            this.drawEverything(this.props.tree_message);

            // Disable all interaction (except for zooming and panning) when
            // the tree isn't editable
            if (treeIsEditable(this.props.tree_message)) {

            }
        }
        // Hide or show data graph
        if (this.props.showDataGraph) {
            d3.select(this.svg_ref.current!).select(".data_graph").attr("visibility", "visible");
        }
        else {
            d3.select(this.svg_ref.current!).select(".data_graph").attr("visibility", "hidden");
        }

        if (this.props.selectedNodeNames) {
            var that = this;
            d3.select(this.svg_ref.current!)
                .selectAll<d3.BaseType, d3.HierarchyNode<TrimmedNode>>(".btnode")
                .each(function (d) {
                    d3.select(this).classed("node-selected", (that.props.selectedNodeNames.indexOf(d.id!) !== -1));
                });
        }
        else {
            d3.select(this.svg_ref.current!)
                .selectAll(".btnode")
                .each(function (d) {
                    d3.select(this).classed("node-selected", false);
                });

        }

        if (this.props.dragging_node_list_item) {
            // show drop targets
            var svg = d3.select(this.svg_ref.current!);
            var g_droptargets = svg.select("g.drop_targets");

            var number_of_droptargets = g_droptargets.selectAll<d3.BaseType, d3.HierarchyNode<TrimmedNode>>(".drop_target").size();

            if (number_of_droptargets === 0) {
                g_droptargets.selectAll<d3.BaseType, d3.HierarchyNode<TrimmedNode>>(".drop_target_root")
                    .attr("visibility", "visible");
                this.resetView();
            } else {
                g_droptargets.selectAll<d3.BaseType, d3.HierarchyNode<TrimmedNode>>(".drop_target_root")
                    .attr("visibility", "hidden");
            }
            g_droptargets.attr("visibility", "visible");
            g_droptargets.selectAll<d3.BaseType, d3.HierarchyNode<TrimmedNode>>(".drop_target")
                // First ensure all drop targets are visible
                .attr("visibility", "visible")
                // Now hide those that belong to descendants of the node we're dragging
                .filter(
                    (x) => {
                        // Hide the left/right drop targets for nodes with
                        // max_children children.
                        var child_names = x.data.child_names || [];
                        var max_children = x.data.max_children || -1;
                        if (max_children !== -1 &&
                            child_names.length === max_children) {
                            return true;
                        }

                        // disable replacing
                        // @ts-ignore
                        if (x.replace) {
                            return true;
                        }
                        return false;
                    })
                .attr("visibility", "hidden");
        } else {
            // hide drop targets
            var svg = d3.select(this.svg_ref.current!);
            var g_droptargets = svg.select("g.drop_targets");
            g_droptargets.attr("visibility", "hidden");
            g_droptargets.selectAll(".drop_target")
                .attr("visibility", "hidden");

            g_droptargets.selectAll(".drop_target_root")
                .attr("visibility", "hidden");
        }
    }

    drawEverything(tree_msg: TreeMsg) {
        if (!tree_msg) {
            return;
        };

        var onlyKeyAndType = (nodeData: NodeData) => ({
            key: nodeData.key,
            serialized_type: nodeData.serialized_type
        } as TrimmedNodeData);

        // Trim the serialized data values from the node data - we won't
        // render them, so don't clutter the DOM with the data
        var trimmed_nodes: TrimmedNode[] = tree_msg.nodes.map((node) => {
            return {
                node_class: node.node_class,
                module: node.module,
                name: node.name,
                state: node.state,
                max_children: node.max_children,
                child_names: node.child_names,
                options: node.options.map(onlyKeyAndType),
                inputs: node.inputs.map(onlyKeyAndType),
                outputs: node.outputs.map(onlyKeyAndType)
            };
        });

        var forest_root: TrimmedNode = {
            node_class: "",
            module: "",
            state: "",
            max_children: -1,
            name: "__forest_root",
            child_names: [],
            inputs: [],
            outputs: [],
            options: []
        };

        if (trimmed_nodes.findIndex(x => x.name === "__forest_root") < 0) {
            trimmed_nodes.push(forest_root);
        }
        // Update the visual tree
        var parents = {};
        var node_dict = {};
        // Find parents for all nodes once
        (function () {
            for (var i in trimmed_nodes) {
                var node = trimmed_nodes[i];
                // @ts-ignore
                node_dict[node.name] = node;
                for (var j in node.child_names) {
                    // @ts-ignore
                    parents[node.child_names[j]] = node.name;
                }
            }
        })();

        var root = d3
            .stratify<TrimmedNode>()
            .id((node) => {
                return node.name;
            })
            .parentId((node) => {
                // undefined if it has no parent - does that break the layout?
                if (node.name in parents) {
                    //@ts-ignore
                    return parents[node.name];
                } else if (node.name === forest_root.name) {
                    return undefined;
                } else {
                    forest_root.child_names.push(node.name);
                    return forest_root.name;
                }
            })(trimmed_nodes);

        root.sort(function (a, b) {
            if (a.depth !== b.depth) {
                return b.depth - a.depth;
            }
            while (a.parent !== b.parent) {
                a = a.parent!;
                b = b.parent!;
            }
            var child_list = a.parent!.data.child_names;
            return (
                child_list.findIndex(x => x === a.data.name) -
                child_list.findIndex(x => x === b.data.name)
            );
        });


        var svg = d3.select<SVGGElement, unknown>(this.svg_ref.current!);


        var container = d3.select<SVGSVGElement, unknown>(this.viewport_ref.current!);
        var width = container.attr("width"),
            height = container.attr("height");


        var g_vertex = svg.selectAll<SVGGElement, unknown>("g.vertices");
        var g_data = svg.selectAll<SVGGElement, unknown>("g.data_graph");

        var node = g_vertex
            .selectAll<SVGForeignObjectElement, d3.HierarchyNode<TrimmedNode>>(".node")
            .data(root.descendants()
                .filter(node => node.id !== forest_root.name),
                (node: d3.HierarchyNode<TrimmedNode>) => {
                    return node.id!;
                });

        node.exit().remove();

        var node1 = node
            .enter()
            .call(this.drawNodes.bind(this))
            //.merge(node)
            .selectAll<HTMLBodyElement, d3.HierarchyNode<TrimmedNode>>(".btnode")
            .data(x => [x], (x: d3.HierarchyNode<TrimmedNode>) => x.id!)
            .call(this.updateNodes.bind(this));

        // TODO(nberg): Find a way to get rid of this - it's here because
        // the DOM changes in updateNodes take a while to actually happen,
        // and layoutNodes needs getBoundingClientRect information...
        window.setTimeout(
            () => {
                this.layoutNodes(svg, width, height, root);

                this.drawDropTargets();

                this.drawDataGraph(g_data, node1.data(), tree_msg.data_wirings);
            }, 100);

    }

    drawNodes(selection: d3.Selection<d3.EnterElement, d3.HierarchyNode<TrimmedNode>, SVGGElement, unknown>) {

        var that = this;
        var fo = selection.append('foreignObject')
            .attr("class", function (d) {
                return "node" + (d.children ? " node--internal" : " node--leaf");
            })
            .on("click", this.nodeClickHandler.bind(this))
            .on("mousedown", function (d, index, group) {
                that.nodeMousedownHandler(d, this);
            })
            .on("dblclick", this.nodeDoubleClickHandler.bind(this));

        var div = fo
            .append("xhtml:body")
            .attr("class", "btnode p-2")
            .style("min-height", d => {
                // We need to ensure a minimum height, in case the node body
                // would otherwise be shorter than the number of grippers
                // requires.
                var inputs = d.data.inputs || [];
                var outputs = d.data.outputs || [];
                var max_num_grippers = Math.max(inputs.length, outputs.length);
                return ((this.io_gripper_size + this.io_gripper_spacing) * max_num_grippers) + 'px';
            });
    }

    updateNodes(selection: d3.Selection<HTMLBodyElement, d3.HierarchyNode<TrimmedNode>, d3.EnterElement, d3.HierarchyNode<TrimmedNode>>) {
        // Update name
        var title = selection.selectAll<HTMLHeadingElement, unknown>(".node_name").data(function (d) {
            return [d];
        });
        title = title.enter().append("h4").attr("class", "node_name").merge(title);
        title.html(function (d) {
            return d.id!;
        });

        var className = selection.selectAll<HTMLHeadingElement, unknown>(".class_name").data(function (d) {
            return [d];
        });
        className = className.enter().append("h5").attr("class", "class_name").merge(className);
        className.html(function (d) {
            return d.data.node_class;
        });
    }

    layoutNodes(svg: d3.Selection<SVGGElement, unknown, null, undefined>, width: string, height: string, root: d3.HierarchyNode<TrimmedNode>) {
        var g_edge = svg.select<SVGGElement>("g.edges");
        var g_vertex = svg.selectAll<SVGGElement, unknown>("g.vertices");

        var nodes_without_forest_root = root.descendants()
            .filter(node => node.id !== '__forest_root');
        // k is the zoom level - we need to apply this to the values we get
        // from getBoundingClientRect, or we get fun scaling effects.
        var zoom = d3.zoomTransform(d3.select<SVGSVGElement, unknown>(this.viewport_ref.current!).node()!).k;

        // Find the maximum size of all the nodes, for layout purposes
        var max_size = [0, 0];
        var max_height_by_depth = Array(root.height + 1).fill(0.0);
        g_vertex.selectAll<HTMLBodyElement, d3.HierarchyNode<TrimmedNode>>('.btnode')
            .data(nodes_without_forest_root,
                x => x.id!)
            .each(function (d, index) {
                var rect = this.getBoundingClientRect();
                rect.x /= zoom;
                rect.y /= zoom;
                rect.width /= zoom;
                rect.height /= zoom;
                //@ts-ignore
                d._size = rect;
                max_height_by_depth[d.depth] = Math.max(max_height_by_depth[d.depth], rect.height);
                this.parentElement!.setAttribute('width', rect.width.toString());
                this.parentElement!.setAttribute('height', rect.height.toString());
            });

        var tree_size = [parseInt(width) - max_size[0], parseInt(height) - (40 + max_size[1])];

        var tree = flextree<TrimmedNode>({})
            .nodeSize((node) => {
                //@ts-ignore
                if (node._size) {
                    //@ts-ignore
                    return [node._size.width + this.spacing,
                    max_height_by_depth[node.depth] + this.spacing];
                }
                else {
                    return [1, 1];
                }
            })
            (root);

        // Move new nodes to their starting positions
        g_vertex.selectAll<SVGForeignObjectElement, d3.HierarchyNode<TrimmedNode>>(".node")
            // @ts-ignore
            .filter(d => d._entering)
            .attr("transform", (d: d3.HierarchyNode<TrimmedNode>) => {
                // Start at parent position
                var p = this.findExistingParent(d);
                //@ts-ignore
                return "translate(" + Math.round(p.x) + "," + Math.round(p.y) + ") scale(0.1)";
            });

        var link = g_edge.selectAll<SVGPathElement, d3.HierarchyLink<TrimmedNode>>(".link")
            .data(tree.links()
                .filter(x => x.source.id! !== '__forest_root' && x.target.id! !== '__forest_root'),
                function (d) { return '' + d.source.id + d.target.id; });
        link.exit().remove();

        link = link
            .enter()
            .append("path")
            .attr("class", "link")
            .attr("d", d3.linkVertical<d3.HierarchyLink<TrimmedNode>, [number, number]>()
                .source((d: d3.HierarchyLink<TrimmedNode>) => {
                    var parent = this.findExistingParent(d.source);
                    //@ts-ignore
                    return [Math.round(parent.x), Math.round(parent.y + parent._size.height)];
                })
                .target((d: d3.HierarchyLink<TrimmedNode>) => {
                    var parent = this.findExistingParent(d.target);
                    //@ts-ignore
                    return [Math.round(parent.x), Math.round(parent.y)];
                }))
            .merge(link);

        g_vertex.selectAll<SVGForeignObjectElement, d3.HierarchyNode<TrimmedNode>>(".node").each(function (d) {
            //@ts-ignore
            d._entering = false;
        });

        link.transition()
            .duration(250).
            attr("d", d3.linkVertical<d3.HierarchyLink<TrimmedNode>, [number, number]>()
                .source(function (d) {
                    //@ts-ignore
                    return [Math.round(d.source.x), Math.round(d.source.y + d.source._size.height)];
                })
                .target(function (d) {
                    //@ts-ignore
                    return [Math.round(d.target.x), Math.round(d.target.y)];
                }));


        // new selection, now with the elements we just added with enter()
        // above
        var node = g_vertex.selectAll<SVGForeignObjectElement, d3.HierarchyNode<TrimmedNode>>(".node")
            .data(root.descendants(), function (node) { return node.id!; });

        node.transition()
            .duration(250)
            .attr("transform", function (d) {
                // animate to actual position
                //@ts-ignore
                return "translate(" + Math.round(d.x - d._size.width / 2.0) + "," + Math.round(d.y) + ") scale(1.0)";
            });
        node
            .selectAll<HTMLBodyElement, d3.HierarchyNode<TrimmedNode>>(".btnode")
            .transition()
            .duration(250)
            .ease(d3.easeQuad)
            // Update color based on node state
            .style("border-color", function (d) {
                switch (d.data.state) {
                    case "RUNNING": {
                        return "#ffc107";
                    }
                    case "IDLE": {
                        return "#007bff";
                    }
                    case "SUCCEEDED": {
                        return "#28a745";
                    }
                    case "FAILED": {
                        return "#dc3545";
                    }
                    case "DEBUG_PRE_TICK":
                    case "DEBUG_POST_TICK":
                    case "DEBUG_TICK": {
                        return "#17a2b8";
                    }
                    case "SHUTDOWN": {
                        return "#7c1e27";
                    }
                    case "UNINITIALIZED":
                    default: {
                        return "#4E5666";
                    }
                };
            });
    }

    findExistingParent(d: d3.HierarchyNode<TrimmedNode>) {
        //@ts-ignore
        while (d._entering && d.parent && d.parent._size) {
            d = d.parent;
        }
        return d;
    }

    getGripperCoords(index, right, gripper_size, node_width) {
        return {
            x: 0.5 * node_width - (right ? 0.0 : gripper_size + node_width),
            y: this.io_gripper_spacing + (index * (this.io_gripper_spacing + gripper_size))
        };
    }

    drawDropTargets() {
        var g_droptargets = d3.select(this.svg_ref.current!).select("g.drop_targets");

        // We can't really assign keys to the targets, so remove them all :/
        g_droptargets.selectAll(".drop_target").remove();

        // For each node, decide what kinds of drop targets to add.
        //
        // Possible drop targets are:
        //
        // Neighbors (left/right):
        // Insert the dropped node into the parent's list of children
        // before or after this node.
        // Only available if the parent doesn't have its maximum number of children yet!
        //
        // Replace (bounding rect of the node itself):
        // Replace this node with the dropped node.
        //
        // Below:
        // Add the dropped node as this node's child - only available if there's 0 children!
        //
        // Above:
        // Add the dropped node as this node's parent, taking over its old position.
        // Note that this is realized by two service calls:
        // 1. Move this node to be dropped node's child
        // 2. Move dropped node to this node's position
        d3.select<SVGGElement, any>(this.svg_ref.current!).select<SVGGElement>("g.vertices").selectAll<SVGForeignObjectElement, d3.HierarchyNode<TrimmedNode>>(".node").each(
            (d) => {
                // No drop options at the root of the tree (__forest_root)!
                if (!d.parent) {
                    return;
                }

                var my_index = d.parent!.children!.findIndex(x => x.data.name == d.data.name);

                // Only add the "insert before" target for the first node.
                // Without this if, we'd get overlapping drop targets for
                // this.after and next_child.before
                if (my_index == 0) {
                    g_droptargets
                        .append("rect")
                        .attr("class", "drop_target")
                        .attr("transform",
                            //@ts-ignore
                            "translate(" + (d.x - this.spacing - (d._size.width * 0.5)) + "," + d.y + ")")
                        .attr("width", this.spacing)
                        //@ts-ignore
                        .attr("height", d._size.height)
                        .datum({
                            position: my_index,  // insert before this node
                            replace: false,
                            data: d.parent.data
                        });
                }
                // Right drop target
                g_droptargets
                    .append("rect")
                    .attr("class", "drop_target")
                    .attr("transform",
                        //@ts-ignore
                        "translate(" + (d.x + (d._size.width * 0.5)) + "," + d.y + ")")
                    .attr("width", this.spacing)
                    //@ts-ignore
                    .attr("height", d._size.height)
                    .datum({
                        position: my_index + 1,  // insert after this node
                        replace: false,
                        data: d.parent.data
                    });

                // Center drop target (on a node)
                g_droptargets
                    .append("rect")
                    .attr("class", "drop_target")
                    .attr("transform",
                        //@ts-ignore
                        "translate(" + (d.x - (d._size.width * 0.5)) + "," + d.y + ")")
                    //@ts-ignore
                    .attr("width", d._size.width)
                    //@ts-ignore
                    .attr("height", d._size.height)
                    .datum({
                        position: -1,
                        replace: true,  // replace this node
                        data: d.data
                    });

                // Top drop target
                g_droptargets
                    .append("rect")
                    .attr("class", "drop_target")
                    .attr("transform",
                        //@ts-ignore
                        "translate(" + (d.x - (d._size.width * 0.5)) + "," + (d.y - (this.spacing * 0.5)) + ")")
                    //@ts-ignore
                    .attr("width", d._size.width)
                    .attr("height", this.spacing * 0.45)
                    .datum({
                        // replace the node at the given index from data, and take
                        // it as our own child
                        position: my_index,
                        replace: true,
                        data: d.parent.data
                    });

                //Bottom drop target
                var child_names = d.data.child_names || [];
                var max_children = d.data.max_children;
                if (max_children === undefined) {
                    max_children = -1;
                }

                // If max_children is either -1 or >0, we can add a child
                if (max_children != 0 || child_names.length < max_children) {
                    g_droptargets
                        .append("rect")
                        .attr("class", "drop_target")
                        .attr("transform",
                            //@ts-ignore
                            "translate(" + (d.x - (d._size.width * 0.5)) + "," + (d.y + d._size.height) + ")")
                        //@ts-ignore
                        .attr("width", d._size.width)
                        .attr("height", this.spacing * 0.45)
                        .datum({
                            // Add as first child of this node
                            position: 0,
                            replace: false,
                            data: d.data
                        });
                }
            });

        var that = this;
        g_droptargets.selectAll(".drop_target")
            .attr("opacity", 0.2)
            .on("mouseover", function (d, index, group) {
                that.dropTargetDefaultMouseoverHandler(this, d);
            })
            .on("mouseout", function (d, index, group) {
                that.dropTargetDefaultMouseoutHandler(this, d);
            });

        // add a special droptarget to enable nodelist drag and drop
        // into an empty editor view
        var viewport = d3.select(this.viewport_ref.current!);
        var drop_target_root_width = 150;
        g_droptargets.selectAll(".drop_target_root").remove();
        g_droptargets
            .append("rect")
            .attr("class", "drop_target_root")
            .attr("width", drop_target_root_width)
            .attr("height", drop_target_root_width)
            .attr("transform",
                "translate(" + (-drop_target_root_width * 0.5) + ","
                + (0) + ")")
            .attr("opacity", 0.2)
            .attr("visibility", "hidden")
            .datum({
                position: -1,
                replace: true,  // replace this node
                data: null
            })
            .on("mouseover", function (d, index, group) {
                that.dropTargetDefaultMouseoverHandler(this, d);
            })
            .on("mouseout", function (d, index, group) {
                that.dropTargetDefaultMouseoutHandler(this, d);
            });
    }

    drawDataGraph(g_data: d3.Selection<SVGGElement, unknown, SVGGElement, unknown>, data: d3.HierarchyNode<TrimmedNode>[], wirings: NodeDataWiring[]) {
        var edges = g_data.select<SVGGElement>("g.data_edges");
        var vertices = g_data.select<SVGGElement>("g.data_vertices");

        var input_vertex_data = [];
        var output_vertex_data = [];
        data.forEach((x) => {
            Array.prototype.push.apply(
                input_vertex_data,
                x.data.inputs.map(
                    (input) => {
                        var datum = this.getIOCoordsFromNode(
                            x,
                            input.key,
                            "inputs",
                /*centered=*/false);
                        datum.nodeName = x.data.name;
                        datum.key = input.key;
                        datum.kind = "input";
                        datum.type = input.serialized_type;
                        return datum;
                    }));

            Array.prototype.push.apply(
                output_vertex_data,
                x.data.outputs.map(
                    (output) => {
                        var datum = this.getIOCoordsFromNode(
                            x,
                            output.key,
                            "outputs",
                /*centered=*/false);
                        datum.nodeName = x.data.name;
                        datum.key = output.key;
                        datum.kind = "output";
                        datum.type = output.serialized_type;
                        return datum;
                    }));
        });

        this.drawDataVerts(vertices, input_vertex_data, output_vertex_data);

        this.drawDataEdges(
            edges,
            wirings.map(function (wiring) {
                var start = this.getIOCoords(data,
                    wiring.source.node_name,
                    wiring.source.data_kind,
                    wiring.source.data_key,
                                       /*centered=*/true);

                var two = {
                    x: start.x,
                    y: start.y - 2
                };

                if (wiring.source.data_kind === "inputs") {
                    two.x = two.x - 10;
                }
                else if (wiring.source.data_kind === "outputs") {
                    two.x = two.x + 10;
                }
                else {
                    // two.y = two.y - 10;
                }

                var target = this.getIOCoords(data,
                    wiring.target.node_name,
                    wiring.target.data_kind,
                    wiring.target.data_key,
                                        /*centered=*/true);

                var three = {
                    x: target.x,
                    y: target.y - 2
                };

                if (wiring.target.data_kind === "inputs") {
                    three.x = three.x - 10;
                }
                else if (wiring.target.data_kind === "outputs") {
                    three.x = three.x + 10;
                }
                else {
                    // three.y = three.y - 10;
                }

                return {
                    source: {
                        node_name: wiring.source.node_name,
                        data_kind: wiring.source.data_kind,
                        data_key: wiring.source.data_key
                    },
                    target: {
                        node_name: wiring.target.node_name,
                        data_kind: wiring.target.data_kind,
                        data_key: wiring.target.data_key
                    },
                    points: [
                        start,
                        two,
                        three,
                        target
                    ]
                };
            }.bind(this)));
    }

    getIOCoords(node_data,
        node_name,
        data_kind,
        data_key,
        centered) {
        var node = node_data.find(d => d.data.name === node_name);
        return this.getIOCoordsFromNode(node, data_key, data_kind, centered);
    }

    getIOCoordsFromNode(
        node: d3.HierarchyNode<TrimmedNode>,
        data_key: string,
        data_kind: string,
        centered: boolean) {
        centered = centered || false;

        if (!node) {
            // Shouldn't really happen...
            return { x: 0, y: 0, gripperSize: 0 };
        }

        var coords = null;
        var inputs = [];
        var outputs = [];

        if (data_kind === 'inputs') {
            coords = this.getGripperCoords(
                node.data.inputs.findIndex(x => x.key === data_key) || 0,
          /*right=*/false,
                this.io_gripper_size,
                //@ts-ignore
                node._size.width);
        }
        else if (data_kind === 'outputs') {
            coords = this.getGripperCoords(
                node.data.outputs.findIndex(x => x.key === data_key) || 0,
          /*right=*/true,
                this.io_gripper_size,
                //@ts-ignore
                node._size.width);
        }
        else {
            // For things that are neither inputs nor outputs, just draw a
            // line to the center of the node
            coords = {
                //@ts-ignore
                x: 0.5 * node._size.width,
                //@ts-ignore
                y: 0.5 * node._size.height
            };
        }

        if (centered) {
            coords.x += this.io_gripper_size * 0.5;
            coords.y += this.io_gripper_size * 0.5;
        }
        return {
            //@ts-ignore
            x: node.x + coords.x,
            //@ts-ignore
            y: node.y + coords.y,
            gripperSize: this.io_gripper_size
        };
    }

    drawDataEdges(edge_selection, edge_data) {
        var link = edge_selection.selectAll(".data-link").data(
            edge_data,
            d => JSON.stringify(d.source) + JSON.stringify(d.target));
        link.exit().remove();

        link = link
            .enter()
            .append("path")
            .attr("class", "data-link")
            .on("click", this.DataEdgeDefaultClickHandler.bind(this))
            .on("mouseover", this.DataEdgeDefaultMouseoverHandler)
            .on("mouseout", this.DataEdgeDefaultMouseoutHandler)
            .merge(link);

        link
            .transition()
            .attr("d", function (d) {
                var lineGen = d3.line()
                    .x(d => d.x)
                    .y(d => d.y)
                    .curve(d3.curveCatmullRom.alpha(0.9));
                return lineGen(d.points);
            });
    }

    drawDataVerts(vertex_selection, input_vertex_data, output_vertex_data) {
        var groups = vertex_selection.selectAll(".gripper-group").data(
            input_vertex_data.concat(output_vertex_data),
            d => d.nodeName + d.kind + d.key);
        groups.exit().remove();

        groups = groups
            .enter()
            .append("g")
            .attr("class", d => "gripper-group " + d.kind + "-gripper-group")
            .on("mouseover.highlight", this.IOGroupDefaultMouseoverHandler)
            .on("mouseout.highlight", this.IOGroupDefaultMouseoutHandler)
            .merge(groups);

        groups
            .transition()
            .attr("transform", function (d) {
                return "translate(" + Math.round(d.x) + ", " + Math.round(d.y) + ")";
            });

        var grippers = groups.selectAll(".gripper").data(d => [d]);
        grippers.exit().remove();

        grippers = grippers
            .enter()
            .append("rect")
            .attr("class", d => "gripper " + d.kind + "-gripper")
            .attr("width", d => d.gripperSize)
            .attr("height", d => d.gripperSize)
            .on("mousedown", this.IOGripperMousedownHandler.bind(this))
            .merge(grippers);

        var labels = groups.selectAll(".label").data(d => [d]);
        labels.exit().remove();

        labels = labels
            .enter()
            .append("text")
            .attr("class", "label")
            .attr("text-anchor", d => d.kind === "input" ? "end" : "start")
            .attr("dominant-baseline", "middle")
            .attr("visibility", "hidden")
            .attr("dx", d => {
                if (d.kind === "input") {
                    return Math.round(-5);
                }
                else if (d.kind === "output") {
                    return Math.round(d.gripperSize + 5);
                }
                return 0;
            })
            .attr("dy", d => Math.round(0.5 * d.gripperSize))
            .merge(labels);

        labels.append("tspan")
            .text(d => d.key)
            .attr("class", "label")
            .attr("dx", d => {
                if (d.kind === "input") {
                    return Math.round(-5);
                }
                else if (d.kind === "output") {
                    return Math.round(d.gripperSize + 5);
                }
                return 0;
            })
            .attr("dy", d => Math.round(0.5 * d.gripperSize));

        labels.append("tspan")
            .text(d => "(type: " + prettyprint_type(d.type) + ")")
            .attr("class", "label")
            .attr("x", 0)
            .attr("dx", d => {
                if (d.kind === "input") {
                    return Math.round(-5);
                }
                else if (d.kind === "output") {
                    return Math.round(d.gripperSize + 5);
                }
                return 0;
            })
            .attr("dy", d => Math.round(0.5 * d.gripperSize) + 10);
    }

    IOGroupDefaultMouseoverHandler(d, index, group) {
        d3.select(this).classed("data-hover", true)
            .selectAll(".label")
            .attr("visibility", "visible");
    }

    IOGroupDefaultMouseoutHandler(d, index, group) {
        d3.select(this).classed("data-hover", false)
            .selectAll(".label")
            .attr("visibility", "hidden");
    }

    IOGroupDraggingMouseoverHandler(d, index, group) {
        if (d.kind === "input") {
            this.nextWiringTarget = d;
        }
        else if (d.kind === "output") {
            this.nextWiringSource = d;
        }
    }

    IOGroupDraggingMouseoutHandler(d, index, group) {
        if (d.kind === "input") {
            this.nextWiringTarget = null;
        }
        else if (d.kind === "output") {
            this.nextWiringSource = null;
        }
    }

    DataEdgeDefaultMouseoverHandler(d, index, group) {
        var vertex_selection = d3.select(this.parentNode.parentNode)
            .select("g.data_vertices");
        d3.select(this).classed("data-hover", true);

        // select source gripper
        selectIOGripper(vertex_selection, d.source)
            .dispatch("mouseover");

        // select target gripper
        selectIOGripper(vertex_selection, d.target)
            .dispatch("mouseover");
    }

    DataEdgeDefaultMouseoutHandler(d, index, group) {
        var vertex_selection = d3.select(this.parentNode.parentNode)
            .select("g.data_vertices");

        d3.select(this).classed("data-hover", false);

        // deselect source gripper
        selectIOGripper(vertex_selection, d.source)
            .dispatch("mouseout");

        // deselect target gripper
        selectIOGripper(vertex_selection, d.target)
            .dispatch("mouseout");
    }

    DataEdgeDefaultClickHandler(d, index, group) {
        this.props.onSelectedEdgeChange(d);
        d3.event.preventDefault();
        d3.event.stopPropagation();
    }

    IOGripperMousedownHandler(datum, index, group) {
        if ((d3.event.buttons & 1) != 1) {
            return;
        }
        // Remove mouseover / out listeners from all gripper-groups, then add new ones
        var svg_sel = d3.select(this.svg_ref.current!);
        var io_grippers = svg_sel.selectAll(".gripper-group");

        io_grippers
            .on("mouseover", null)
            .on("mouseout", null);

        // Remove mouseover listener from data edges so we don't
        // accidentally send a mouseover event to a gripper while crossing
        // an edge connected to it
        svg_sel.selectAll('.data-link')
            .on("mouseover", null)
            .on("mouseout", null);

        // Hide this gripper's label
        svg_sel.selectAll(".label").datum(datum).attr("visibility", "hidden");

        // Save the datum to use in the wire request later
        if (datum.kind === "input") {
            this.nextWiringTarget = datum;
        }
        else if (datum.kind === "output") {
            this.nextWiringSource = datum;
        }

        // Also save the current mouse position (relative to the viewport
        // <g> tag)
        this.dragStartPos = d3.mouse(this.svg_ref.current!);

        // Give compatible IOs a new listener and highlight them
        io_grippers
            .filter(d => typesCompatible(d, datum))
            .classed("compatible", true)
            .on("mouseover.drag",
                this.IOGroupDraggingMouseoverHandler.bind(this))
            .on("mouseout.drag",
                this.IOGroupDraggingMouseoutHandler.bind(this))
            .selectAll(".label")
            .attr("visibility", "visible");

        this.dragging = true;
        // Give the canvas a move and mouseup handler
        d3.select(this.viewport_ref.current!)
            // Remove any handlers for node dragging
            .on("mousemove.drag_node", null)
            .on("mouseup.drag_node", null)
            .on("mousemove.drag_io", this.canvasIOMoveHandler.bind(this))
            .on("mouseup.drag_io", this.canvasIOUpHandler.bind(this));

        d3.event.preventDefault();
        d3.event.stopPropagation();
    }

    canvasMousemovePanHandler(d, index, group) {
        // Don't do anything unless we're currently dragging something
        if (!this.dragging) {
            if (this.panIntervalID !== null) {
                window.clearInterval(this.panIntervalID);
                this.panDirection = [];
            }

            return;
        }

        var viewport = d3.select(this.viewport_ref.current!);
        var width = viewport.node().getBoundingClientRect().width;
        var height = viewport.node().getBoundingClientRect().height;

        var mouseCoords = d3.mouse(this.viewport_ref.current!);

        var panNeeded = false;
        this.panDirection = [0.0, 0.0];

        if (mouseCoords[0] < this.dragPanBoundary) {
            // Left edge -> scroll right
            panNeeded = true;
            // 1 if mouse is at the left edge, 0 if it is dragPanBoundary pixels away
            var leftEdgeCloseness = (this.dragPanBoundary - mouseCoords[0]) / this.dragPanBoundary;
            this.panDirection[0] = this.panPerFrame * leftEdgeCloseness;
        } else if (mouseCoords[0] > (width - this.dragPanBoundary)) {
            // Right edge -> scroll left
            panNeeded = true;
            // 1 if mouse is at the right edge, 0 if it is dragPanBoundary pixels away
            var rightEdgeCloseness = (this.dragPanBoundary - (width - mouseCoords[0])) / this.dragPanBoundary;
            this.panDirection[0] = -1.0 * this.panPerFrame * rightEdgeCloseness;
        }
        if (mouseCoords[1] < this.dragPanBoundary) {
            // Up -> scroll down
            panNeeded = true;
            // 1 if mouse is at the top edge, 0 if it is dragPanBoundary pixels away
            var topEdgeCloseness = (this.dragPanBoundary - mouseCoords[1]) / this.dragPanBoundary;
            this.panDirection[1] = this.panPerFrame * topEdgeCloseness;
        } else if (mouseCoords[1] > (height - this.dragPanBoundary)) {
            // Down -> scroll up
            panNeeded = true;
            // 1 if mouse is at the bottom edge, 0 if it is dragPanBoundary pixels away
            var botEdgeCloseness = (this.dragPanBoundary - (height - mouseCoords[1])) / this.dragPanBoundary;
            this.panDirection[1] = -1.0 * this.panPerFrame * botEdgeCloseness;
        }

        if (!panNeeded && this.panIntervalID !== null) {
            window.clearInterval(this.panIntervalID);
            this.panIntervalID = null;
            return;
        }

        if (this.panIntervalID === null) {
            // Start the interval for the panning animation, at panRate Hz
            this.panIntervalID = window.setInterval(this.dragPanTimerHandler, 1000.0 / this.panRate);
        }
    }

    dragPanTimerHandler() {
        if (!this.dragging && this.panIntervalID) {
            window.clearInterval(this.panIntervalID);
            this.panIntervalID = null;
            return;
        }

        d3.select(this.viewport_ref.current!)
            .call(this.zoomObject.translateBy, this.panDirection[0], this.panDirection[1]);
    }

    canvasIOMoveHandler(d, index, group) {
        if ((d3.event.buttons & 1) === 0) {
            this.canvasIOUpHandler(d, index, group);
            return;
        }

        var drawingLine = d3
            .select(this.svg_ref.current!)
            .selectAll(".drawing-indicator")
            .data(
                [{
                    start: this.dragStartPos,
                    end: d3.mouse(this.svg_ref.current!)
                }],
            /*key=*/d => JSON.stringify(d.start));

        drawingLine.exit().remove();
        drawingLine = drawingLine
            .enter()
            .append("path")
            .attr("class", "drawing-indicator")
            .merge(drawingLine);

        drawingLine
            .attr("d", data => d3.line()([data.start, data.end]));
        d3.event.preventDefault();
    }

    canvasIOUpHandler(d, index, group) {
        this.dragging = false;

        if (this.nextWiringSource && this.nextWiringTarget) {
            this.wire_service.callService(
                {
                    wirings: [
                        {
                            source: {
                                node_name: this.nextWiringSource.nodeName,
                                data_kind: this.nextWiringSource.kind + "s", // should be inputs!
                                data_key: this.nextWiringSource.key
                            },
                            target: {
                                node_name: this.nextWiringTarget.nodeName,
                                data_kind: this.nextWiringTarget.kind + "s", // should be outputs!
                                data_key: this.nextWiringTarget.key
                            }
                        }]
                } as WireNodeDataRequest,
                (response) => {
                    if (response.success) {
                        console.log("Successfully wired data!");
                    }
                    else {
                        this.props.onError("Failed to wire data " + this.nextWiringSource +
                            " to " + this.nextWiringTarget + ": " + JSON.stringify(response));
                    }
                });
        }

        // Either way, we're done dragging, so restore the old handlers

        // Remove mouseover / out listeners from all gripper-groups, then
        // add back the default ones
        var io_grippers = d3.select(this.svg_ref.current!).selectAll(".gripper-group");
        io_grippers
            .on("mouseover", null)
            .on("mouseout", null)
            // Also remove this class again
            .classed("data-hover", false)
            .classed("compatible", false);

        io_grippers
            // Remove the drag listeners
            .on("mouseover.drag", null)
            .on("mouseout.drag", null)
            // And hide the labels again
            .selectAll(".label")
            .attr("visibility", "hidden");


        d3.select(this.svg_ref.current!).selectAll('.data-link')
            .on("mouseover", this.DataEdgeDefaultMouseoverHandler)
            .on("mouseout", this.DataEdgeDefaultMouseoutHandler);

        // Also remove listeners from the background
        d3.select(this.viewport_ref.current!)
            .on("mousemove.drag_io", null)
            .on("mouseup.drag_io", null);

        // Remove the drawing line from the DOM
        d3.select(this.viewport_ref.current!).selectAll(".drawing-indicator").data([])
            .exit().remove();

        // Finally, remove these:
        this.nextWiringSource = null;
        this.nextWiringTarget = null;
    }

    canvasNodeDragMoveHandler() {
        if (this.draggedNode === null) {
            return;
        }
        var newly_dragging = (
            !this.dragging
            && getDist(d3.mouse(this.draggedNode.domObject),
                this.draggedNode.startCoords) > this.min_node_drag_distance);

        if (newly_dragging) {
            this.dragging = true;
            // Hide all drop targets that would lead to appending the dragged
            // node to its own subtree
            var d = this.draggedNode.data;
            var parentName = d.parent ? d.parent.data.name || '' : '';
            var my_index = d.parent.children.findIndex(x => x.data.name == d.data.name);

            var svg = d3.select(this.svg_ref.current!);

            var all_children = d.descendants().map(x => x.data.name);

            var g_droptargets = svg.select("g.drop_targets");

            g_droptargets.attr("visibility", "visible");

            g_droptargets.selectAll(".drop_target")
                // First ensure all drop targets are visible
                .attr("visibility", "visible")
                // Now hide those that belong to descendants of the node we're dragging
                .filter(
                    x => {
                        // Hide drop targets of children
                        if (all_children.indexOf(x.data.name) >= 0) {
                            return true;
                        }
                        // Hide the left/right drop targets
                        if (x.data.name === parentName
                            && (x.position == my_index
                                || x.position == my_index + 1)) {
                            return true;
                        }
                        // Hide the left/right drop targets for nodes that are
                        // children of a *different* parent than ours, with
                        // max_children children. (if its our own parent, moving
                        // us won't change the number of children, so we're okay)
                        var child_names = x.data.child_names || [];
                        var max_children = x.data.max_children || -1;
                        if (x.data.name !== parentName &&
                            max_children !== -1 &&
                            child_names.length === max_children) {
                            return true;
                        }
                        return false;
                    })
                .attr("visibility", "hidden");
        }

        if ((d3.event.buttons & 1) === 0) {
            this.canvasNodeDragUpHandler(d, index, group);
        }

        d3.event.preventDefault();
        d3.event.stopPropagation();
    }

    canvasNodeDragUpHandler(d, index, group) {
        if (this.dragging) {
            if (this.nodeDropTarget) {
                // Calculate the final index to move the dropped node to.
                //
                // If the target is in the same parent node, and after the
                // current index of the dropped node, subtract one from the
                // target index to make the behavior more intuitive

                if (this.nodeDropTarget.position > 0
                    && this.nodeDropTarget.data.name === this.draggedNode.data.parent.data.name
                    && this.draggedNode.data.parent.data.child_names.indexOf(
                        this.draggedNode.data.data.name) < this.nodeDropTarget.position) {
                    this.nodeDropTarget.position -= 1;
                }

                // Also replace __forest_root with the empty string if present
                if (this.nodeDropTarget.data.name === "__forest_root") {
                    this.nodeDropTarget.data.name = "";
                }

                // Three possible cases:

                // 1. Valid position, replace == false
                //    In this case we just call MoveNode with the given
                //    parent node and index
                if (this.nodeDropTarget.position >= 0
                    && !this.nodeDropTarget.replace) {
                    this.move_service.callService(
                        {
                            node_name: this.draggedNode.data.data.name,
                            new_parent_name: this.nodeDropTarget.data.name,
                            new_child_index: this.nodeDropTarget.position
                        } as MoveNodeRequest,
                        (response) => {
                            if (response.success) {
                                console.log("Successfully moved node!");
                            }
                            else {
                                this.props.onError("Failed to move node: " + response.error_message);
                            }
                        });
                }
                // 2. Valid position, replace == true
                //    First, remove the dropped node from its parent to prevent cycles.
                //    Then, move the node at the selected position to be our child,
                //    and finally move the dropped node to the indicated position as in 1.
                else if (this.nodeDropTarget.position >= 0
                    && this.nodeDropTarget.replace) {
                    this.move_service.callService(
                        {
                            node_name: this.draggedNode.data.data.name,
                            new_parent_name: ''
                        } as MoveNodeRequest,
                        (response) => {
                            if (response.success) {
                                console.log("Successfully removed dropped node from its parent!");
                                this.move_service.callService(
                                    {
                                        // nodeDropTarget is the *parent* of the node we want to move!
                                        node_name: this.nodeDropTarget.data.child_names[this.nodeDropTarget.position],
                                        new_parent_name: this.draggedNode.data.data.name,
                                        new_child_index: -1
                                    } as MoveNodeRequest,
                                    (response) => {
                                        if (response.success) {
                                            console.log("Successfully moved old node to be a child of dropped node, "
                                                + "now moving dropped node!");
                                            this.move_service.callService(
                                                {
                                                    node_name: this.draggedNode.data.data.name,
                                                    // Now the parent of the node we moved first will become our parent!
                                                    new_parent_name: this.nodeDropTarget.data.name,
                                                    new_child_index: this.nodeDropTarget.position
                                                } as MoveNodeRequest,
                                                (response) => {
                                                    if (response.success) {
                                                        console.log("Successfully moved dropped node to the place "
                                                            + "the old node was in!");
                                                    }
                                                    else {
                                                        this.props.onError("Failed to move node: " + response.error_message);
                                                    }
                                                });
                                        }
                                        else {
                                            this.props.onError("Failed to move node: " + response.error_message);
                                        }
                                    });
                            }
                            else {
                                this.props.onError("Failed to move node: " + response.error_message);
                            }
                        });
                }
                // 3. position === -1, replace == true
                //    Call ReplaceNode with the given node name
                else if (this.nodeDropTarget.position == -1
                    && this.nodeDropTarget.replace) {
                    this.replace_service.callService(
                        {
                            old_node_name: this.nodeDropTarget.data.name,
                            new_node_name: this.draggedNode.data.data.name
                        } as ReplaceNodeRequest,
                        (response) => {
                            if (response.success) {
                                console.log("Successfully replaced old node with dropped node!");
                            }
                            else {
                                this.props.onError("Failed to replace node: " + response.error_message);
                            }
                        });
                }
                else {
                    this.props.onError("Unexpected data for dropping a node :(");
                }
                d3.event.preventDefault();
                d3.event.stopPropagation();
            }
            else {
                console.log("should trigger the click event, hopefully?");
            }
        }

        this.dragging = false;

        d3.select(this.svg_ref.current!).select("g.drop_targets")
            .attr("visibility", "hidden")
            .selectAll(".drop_target")
            .attr("visibility", "");

        d3.select(this.viewport_ref.current!)
            .on("mousemove.drag_node", null)
            .on("mouseup.drag_node", null);
    }

    nodeClickHandler(d, index, group) {
        if (d3.event.shiftKey) {
            this.props.onMultipleSelectionChange(Array.from(new Set(this.props.selectedNodeNames.concat([d.data.name]))));
        } else {
            this.props.onSelectionChange(d.data.name);
        }
        d3.event.preventDefault();
        d3.event.stopPropagation();
    }

    nodeDoubleClickHandler(d, index, group) {
        if (d.data.module === "ros_bt_py.nodes.subtree" && d.data.node_class === "Subtree") {
            var selected_subtree = this.props.subtreeNames.filter((subtree) => subtree === d.data.name);
            if (selected_subtree.length == 1) {
                this.props.onSelectedTreeChange(
            /*is_subtree=*/ true,
            /*name=*/ selected_subtree[0]);
            } else {
                if (this.props.publishing_subtrees) {
                    this.props.onError("Selected subtree does not exist, this should not happen.");
                } else {
                    this.props.onError("Cannot show a Subtree that is not published. Please enable \"Publish Subtrees\"!")
                }
            }
        }
        d3.event.preventDefault();
        d3.event.stopPropagation();
    }

    nodeMousedownHandler(d, domObject) {
        if ((d3.event.buttons & 1) != 1) {
            return;
        }

        // No dragging the fake root!
        if (d.data.name == "__forest_root") {
            return;
        }

        this.draggedNode = {
            startCoords: d3.mouse(domObject),
            domObject: domObject,
            data: d
        };

        this.dragging = false;

        // Add move and mouseup handlers to viewport, and just to be sure,
        // remove the drag_io handlers in case they're present
        d3.select(this.viewport_ref.current!)
            .on("mousemove.drag_io", null)
            .on("mouseup.drag_io", null)
            .on("mousemove.drag_node", this.canvasNodeDragMoveHandler.bind(this))
            .on("mouseup.drag_node", this.canvasNodeDragUpHandler.bind(this));

        d3.event.preventDefault();
        d3.event.stopPropagation();
    }

    dropTargetDefaultMouseoverHandler(domElement, datum) {
        this.nodeDropTarget = datum;
        d3.select(domElement).attr("opacity", 0.8);
    }

    dropTargetDefaultMouseoutHandler(domElement, datum) {
        this.nodeDropTarget = null;
        d3.select(domElement).attr("opacity", 0.2);
    }

    resetView() {
        var viewport = d3.select(this.viewport_ref.current!);
        var height = viewport.node()!.getBoundingClientRect().height;

        var container = d3.select(this.svg_ref.current!);

        viewport
            .call(this.zoomObject!.scaleExtent([0.3, 1.0]).on("zoom", function () {
                container.attr("transform", d3.event.transform);
            }))
            .call(this.zoomObject!.translateTo, 0.0, (height * 0.5) - 10.0);
    }
}
