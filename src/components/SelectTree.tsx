import { ChangeEvent, Component } from "react";

interface SelectTreeProps {
    ros: ROSLIB.Ros
    bt_namespace: string
    subtreeNames: string[]
    selected_tree: { name: string; is_subtree: boolean }
    onSelectedTreeChange: (is_subtree: boolean, name: string) => void
    onError: (error_msg: string) => void
}

interface SelectTreeState {

}

export class SelectTree extends Component<SelectTreeProps, SelectTreeState> {
    constructor(props: SelectTreeProps) {
        super(props);

        this.onChange = this.onChange.bind(this);
    }

    onChange(event: ChangeEvent<HTMLSelectElement>) {
        var value = parseInt(event.target.value);
        if (value < 0) {
            this.props.onSelectedTreeChange(
          /*is_subtree=*/ false,
          /*name=*/ ''); // no name needed, there's only one not-subtree
        }
        else {
            this.props.onSelectedTreeChange(
          /*is_subtree=*/ true,
          /*name=*/ this.props.subtreeNames[value]);
        }
    }

    render() {
        var selected = "main";
        if (this.props.selected_tree.is_subtree && this.props.selected_tree.name !== "") {
            selected = this.props.selected_tree.name;
        }
        return (
            <div>
                <label className="form-inline m-1 ml-2">Tree:
                    <select className="custom-select ml-1"
                        value={this.props.subtreeNames.indexOf(selected)}
                        onChange={this.onChange}>
                        <option value="-1">Main Tree</option>
                        <optgroup label="Subtrees">
                            {
                                this.props.subtreeNames.map(
                                    (name, index) => (<option key={name} value={index}>{name}</option>))
                            }
                        </optgroup>
                    </select>
                </label>
            </div>
        );
    }
}
