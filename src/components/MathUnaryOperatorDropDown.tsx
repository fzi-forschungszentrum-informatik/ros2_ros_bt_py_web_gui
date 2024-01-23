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

interface MathUnaryOperatorDropDownProps {
  json: any;
  message_type: string;
  onFocus: (_event: React.FocusEvent) => void;
  onNewValue: (new_value: any) => void;
}

interface MathUnaryOperatorDropDownState {
  json: any;
  operator: any;
  operators: string[];
}

export class MathUnaryOperatorDropDown extends Component<
  MathUnaryOperatorDropDownProps,
  MathUnaryOperatorDropDownState
> {
  constructor(props: MathUnaryOperatorDropDownProps) {
    super(props);

    this.state = {
      json: props.json,
      operator: props.json.operator,
      operators: [
        "not",
        "inv",
        "~",
        "neg",
        "-",
        "pos",
        "+",
        "exp",
        "expm1",
        "log",
        "log1p",
        "log10",
        "ceil",
        "fabs",
        "factorial",
        "floor",
        "sqrt",
        "acos",
        "asin",
        "atan",
        "acosh",
        "asinh",
        "atanh",
        "cos",
        "sin",
        "tan",
        "cosh",
        "sinh",
        "tanh",
        "degrees",
        "radians",
        "erf",
        "erfc",
        "gamma",
        "lgamma",
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
