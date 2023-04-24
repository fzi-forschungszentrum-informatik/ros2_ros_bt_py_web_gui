import { ChangeEvent, Component } from "react";

interface PackageLoaderProps {
    getNodes: (package_name: string) => void
}

interface PackageLoaderState {
    package_name: string,
    package_loader_collapsed: boolean
}

export class PackageLoader extends Component<PackageLoaderProps, PackageLoaderState> {
    constructor(props: PackageLoaderProps) {
        super(props);

        this.state = {
            package_name: 'ros_bt_py.nodes.sequence',
            package_loader_collapsed: true,
        };

        this.handleChange = this.handleChange.bind(this);
    }

    componentDidMount() {
        this.props.getNodes('');
    }

    handleChange(e: ChangeEvent<HTMLInputElement>) {
        this.setState({ package_name: e.target.value });
    }

    toggleCollapsed(event: React.MouseEvent<HTMLDivElement>) {
        this.setState({ package_loader_collapsed: !this.state.package_loader_collapsed });
        event.stopPropagation();
    }

    render() {
        var collapsible_icon = "fas fa-angle-up";
        var package_loader = null;
        if (this.state.package_loader_collapsed) {
            collapsible_icon = "fas fa-angle-down";
        } else {
            package_loader = (
                <div className="form-group">
                    <button id="refresh"
                        className="btn btn-block btn-primary mt-2"
                        onClick={() => this.props.getNodes('')}>
                        Refresh
                    </button>
                    <input type="text" id="package_name"
                        className="form-control mt-2"
                        value={this.state.package_name}
                        onChange={this.handleChange} />
                    <button id="load_package"
                        className="btn btn-block btn-primary mt-2"
                        onClick={() => this.props.getNodes(this.state.package_name)}>
                        Load package
                    </button>
                </div>
            );
        }
        return (
            <div className="border rounded mb-2">
                <div onClick={this.toggleCollapsed.bind(this)} className="text-center cursor-pointer font-weight-bold m-2">Package Loader <i className={collapsible_icon}></i></div>
                {package_loader}
            </div>
        )
    };
}
