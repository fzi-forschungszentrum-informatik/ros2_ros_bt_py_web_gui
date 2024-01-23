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
import { ChangeEvent, Component } from "react";

interface SelectTreeProps {
  ros: ROSLIB.Ros;
  bt_namespace: string;
  subtreeNames: string[];
  selected_tree: { name: string; is_subtree: boolean };
  onSelectedTreeChange: (is_subtree: boolean, name: string) => void;
  onError: (error_msg: string) => void;
}

interface SelectTreeState {}

export class SelectTree extends Component<SelectTreeProps, SelectTreeState> {
  constructor(props: SelectTreeProps) {
    super(props);

    this.onChange = this.onChange.bind(this);
  }

  onChange(event: ChangeEvent<HTMLSelectElement>) {
    const value = parseInt(event.target.value);
    if (value < 0) {
      this.props.onSelectedTreeChange(/*is_subtree=*/ false, /*name=*/ ""); // no name needed, there's only one not-subtree
    } else {
      this.props.onSelectedTreeChange(
        /*is_subtree=*/ true,
        /*name=*/ this.props.subtreeNames[value]
      );
    }
  }

  render() {
    let selected = "main";
    if (
      this.props.selected_tree.is_subtree &&
      this.props.selected_tree.name !== ""
    ) {
      selected = this.props.selected_tree.name;
    }
    return (
      <div className="d-flex flex-row align-items-center">
        <label className="col-form-label m-1 ms-2" htmlFor="formTree">
          Tree:
        </label>

        <select
          id="formTree"
          className="form-select m-2"
          value={this.props.subtreeNames.indexOf(selected)}
          onChange={this.onChange}
        >
          <option value="-1">Main Tree</option>
          <optgroup label="Subtrees">
            {this.props.subtreeNames.map((name, index) => (
              <option key={name} value={index}>
                {name}
              </option>
            ))}
          </optgroup>
        </select>
      </div>
    );
  }
}
