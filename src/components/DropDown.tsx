import React, { Component } from "react";

interface DropDownProps {
  json: any;
  message_type: string;
  onFocus: (_event: React.FocusEvent) => void;
  onNewValue: (new_value: any) => void;
}

interface DropDownState {
  logger_level: string;
  json: any;
}

export class DropDown extends Component<DropDownProps, DropDownState> {
  constructor(props: DropDownProps) {
    super(props);

    this.state = {
      json: props.json,
      logger_level: props.json.logger_level,
    };
  }

  handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const json = this.state.json;
    json.logger_level = event.target.value;
    this.setState({ json: json, logger_level: event.currentTarget.value });

    this.props.onNewValue(json);
  };

  render() {
    return (
      <select value={this.state.logger_level} onChange={this.handleChange}>
        <option value="debug">DEBUG</option>
        <option value="info">INFO</option>
        <option value="warning">WARNING</option>
        <option value="error">ERROR</option>
        <option value="fatal">FATAL</option>
      </select>
    );
  }
}
