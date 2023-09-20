import React, { ChangeEvent, Component } from "react";

interface PackageLoaderProps {
  getNodes: (package_name: string) => void;
}

interface PackageLoaderState {
  package_name: string;
  package_loader_collapsed: boolean;
}

export class PackageLoader extends Component<
  PackageLoaderProps,
  PackageLoaderState
> {
  constructor(props: PackageLoaderProps) {
    super(props);

    this.state = {
      package_name: "ros_bt_py.nodes.sequence",
      package_loader_collapsed: true,
    };

    this.handleChange = this.handleChange.bind(this);
  }

  componentDidMount() {
    this.props.getNodes("");
  }

  handleChange(e: ChangeEvent<HTMLInputElement>) {
    this.setState({ package_name: e.target.value });
  }

  toggleCollapsed(event: React.MouseEvent<HTMLDivElement>) {
    this.setState({
      package_loader_collapsed: !this.state.package_loader_collapsed,
    });
    event.stopPropagation();
  }

  render() {
    let collapsible_icon = "fas fa-angle-up";
    let package_loader = null;
    if (this.state.package_loader_collapsed) {
      collapsible_icon = "fas fa-angle-down";
    } else {
      package_loader = (
        <div className="m-2">
          <div className="d-grid gap-2 mb-2">
            <button
              id="refresh"
              className="btn btn-block btn-primary mt-2"
              onClick={() => this.props.getNodes("")}
            >
              Refresh
            </button>
          </div>
          <div className="input-group mb-3">
            <input
              type="text"
              className="form-control"
              id="loadPackageForm"
              aria-describedby="loadPackageFormConfirm"
              aria-label="Load Package"
              value={this.state.package_name}
              onChange={this.handleChange}
            />
            <button
              type="button"
              className="btn btn-block btn-outline-primary"
              onClick={() => this.props.getNodes(this.state.package_name)}
              id="loadPackageFormConfirm"
            >
              Load package
            </button>
          </div>
        </div>
      );
    }
    return (
      <div className="border rounded mb-2">
        <div
          onClick={this.toggleCollapsed.bind(this)}
          className="text-center cursor-pointer font-weight-bold m-2"
        >
          Package Loader{" "}
          <i key={collapsible_icon}>
            <span className={collapsible_icon} />
          </i>
        </div>
        {package_loader}
      </div>
    );
  }
}
