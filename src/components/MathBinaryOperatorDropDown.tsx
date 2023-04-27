import React, { ChangeEvent, Component } from "react";

interface MathBinaryOperatorDropDownProps {
  json: any;
  message_type: string;
  onFocus: (_event: React.FocusEvent) => void;
  onNewValue: (new_value: any) => void;
}

interface MathBinaryOperatorDropDownState {
  json: any;
  operator: any;
  operators: string[];
}

export class MathBinaryOperatorDropDown extends Component<
  MathBinaryOperatorDropDownProps,
  MathBinaryOperatorDropDownState
> {
  constructor(props: MathBinaryOperatorDropDownProps) {
    super(props);

    this.state = {
      json: props.json,
      operator: props.json.operator,
      operators: [
        "add",
        "+",
        "and",
        "&",
        "div",
        "/",
        "floordiv",
        "//",
        "lshift",
        "<<",
        "mod",
        "%",
        "mul",
        "*",
        "or",
        "|",
        "pow",
        "**",
        "rshift",
        ">>",
        "sub",
        "-",
        "truediv",
        "xor",
        "^",
      ],
    };
  }

  handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const json = this.state.json;
    json.operator = event.target.value;
    this.setState({ json: json, operator: event.target.value });

    this.props.onNewValue(json);
  };

  render() {
    let items = null;
    items = this.state.operators.map((item) => {
      return <option value={item}>{item}</option>;
    });

    return (
      <select value={this.state.operator} onChange={this.handleChange}>
        {items}
      </select>
    );
  }
}
