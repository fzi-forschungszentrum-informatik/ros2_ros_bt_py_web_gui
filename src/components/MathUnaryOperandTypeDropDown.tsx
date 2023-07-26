import React, { Component } from "react";

interface MathUnaryOperandTypeDropDownProps {
  json: any;
  message_type: string;
  onFocus: (_event: React.FocusEvent) => void;
  onNewValue: (new_value: any) => void;
}

interface MathUnaryOperandTypeDropDownState {
  json: any;
  operand_type: string;
  operand_types: string[];
}

export class MathUnaryOperandTypeDropDown extends Component<
  MathUnaryOperandTypeDropDownProps,
  MathUnaryOperandTypeDropDownState
> {
  constructor(props: MathUnaryOperandTypeDropDownProps) {
    super(props);

    this.state = {
      json: props.json,
      operand_type: props.json.operand_type,
      operand_types: ["int", "float"],
    };
  }

  handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const json = this.state.json;
    json.operand_type = event.target.value;
    this.setState({ json: json, operand_type: event.target.value });

    this.props.onNewValue(json);
  };

  render() {
    let items = null;
    items = this.state.operand_types.map((item) => {
      return <option value={item}>{item}</option>;
    });

    return (
      <select value={this.state.operand_type} onChange={this.handleChange}>
        {items}
      </select>
    );
  }
}
