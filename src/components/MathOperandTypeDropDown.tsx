import { ChangeEvent, Component } from "react";

interface MathOperandTypeDropDownProps {
    json: any
    message_type: string
    onFocus: (_event: React.FocusEvent) => void
    onNewValue: (new_value: any) => void
}

interface MathOperandTypeDropDownState {
    json: any
    operand_type: any,
    operand_types: string[]
}

export class MathOperandTypeDropDown extends Component<MathOperandTypeDropDownProps, MathOperandTypeDropDownState> {
    constructor(props: MathOperandTypeDropDownProps) {
        super(props);

        this.state = {
            json: props.json,
            operand_type: props.json.operand_type,
            operand_types: ['int', 'float', 'bool']
        };
    }

    handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
        var json = this.state.json;
        json.operand_type = event.target.value;
        this.setState({ json: json, operand_type: event.target.value });

        this.props.onNewValue(json);
    };

    render() {
        var items = null;
        items = this.state.operand_types
            .map((item) => {
                return (<option value={item}>{item}</option>);
            });

        return (
            <select value={this.state.operand_type} onChange={this.handleChange}>
                {items}
            </select>
        );
    }
}
