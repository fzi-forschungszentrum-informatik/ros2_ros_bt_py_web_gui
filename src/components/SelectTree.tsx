import React, { ChangeEvent, Component } from "react";

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
