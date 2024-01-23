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

interface EnumDropDownProps {
  json: any;
  message_type: string;
  onFocus: (_event: React.FocusEvent) => void;
  onNewValue: (new_value: any) => void;
  onValidityChange: (new_validity: boolean) => void;
}

interface EnumDropDownState {
  json: any;
  enum_value: any;
  field_names: string[];
}

export class EnumDropDown extends Component<
  EnumDropDownProps,
  EnumDropDownState
> {
  constructor(props: EnumDropDownProps) {
    super(props);

    let enum_value = "";
    let field_names = [];
    if (props.json.enum_value !== undefined) {
      enum_value = props.json.enum_value;
    }

    if (props.json.field_names !== undefined) {
      field_names = props.json.field_names;
    }

    this.state = {
      json: props.json,
      enum_value: enum_value,
      field_names: field_names,
    };
  }

  componentDidUpdate(prevProps: EnumDropDownProps) {
    if (JSON.stringify(this.props.json) != JSON.stringify(prevProps.json)) {
      let enum_value = "";
      let field_names = [];
      if (this.props.json.value !== undefined) {
        enum_value = this.props.json.value.enum_value;
        field_names = this.props.json.value.field_names;
      } else {
        enum_value = this.props.json.enum_value;
        field_names = this.props.json.field_names;
      }

      this.setState({
        json: this.props.json,
        enum_value: enum_value,
        field_names: field_names,
      });

      if (field_names.length > 0) {
        this.props.onValidityChange(true);
      } else {
        this.props.onValidityChange(false);
      }
    }
  }

  handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    this.setState({ enum_value: event.target.value });

    const json = {
      type: "ros_bt_py.ros_helpers.EnumValue",
      value: {
        "py/object": "ros_bt_py.ros_helpers.EnumValue",
        enum_value: event.target.value,
        field_names: this.state.field_names,
      },
    };

    this.props.onNewValue(json.value);
  };

  render() {
    let items = null;
    items = this.state.field_names.map((item) => {
      return <option value={item}>{item}</option>;
    });

    return (
      <select value={this.state.enum_value} onChange={this.handleChange}>
        {items}
      </select>
    );
  }
}
