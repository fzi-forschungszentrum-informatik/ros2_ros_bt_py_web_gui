/*
 * Copyright 2024 FZI Forschungszentrum Informatik
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 *    * Redistributions of source code must retain the above copyright
 *      notice, this list of conditions and the following disclaimer.
 *
 *    * Redistributions in binary form must reproduce the above copyright
 *      notice, this list of conditions and the following disclaimer in the
 *      documentation and/or other materials provided with the distribution.
 *
 *    * Neither the name of the {copyright_holder} nor the names of its
 *      contributors may be used to endorse or promote products derived from
 *      this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */
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
