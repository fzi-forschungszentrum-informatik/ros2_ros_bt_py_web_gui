import { ChangeEvent, Component } from "react";

interface MathUnaryOperatorDropDownProps {
    json: any
    message_type: string
    onFocus: (_event: React.FocusEvent) => void
    onNewValue: (new_value: any) => void
}

interface MathUnaryOperatorDropDownState {
    json: any
    operator: any,
    operators: string[]
}

export class MathUnaryOperatorDropDown extends Component<MathUnaryOperatorDropDownProps, MathUnaryOperatorDropDownState> {
    constructor(props: MathUnaryOperatorDropDownProps) {
        super(props);

        this.state = {
            json: props.json,
            operator: props.json.operator,
            operators: ['not', 'inv', '~', 'neg', '-', 'pos', '+', 'exp', 'expm1', 'log',
                'log1p', 'log10', 'ceil', 'fabs', 'factorial', 'floor', 'sqrt',
                'acos', 'asin', 'atan', 'acosh', 'asinh', 'atanh',
                'cos', 'sin', 'tan', 'cosh', 'sinh', 'tanh',
                'degrees', 'radians', 'erf', 'erfc', 'gamma', 'lgamma']
        };
    }

    handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
        var json = this.state.json;
        json.operator = event.target.value;
        this.setState({ json: json, operator: event.target.value });

        this.props.onNewValue(json);
    };

    render() {
        var items = null;
        items = this.state.operators
            .map((item) => {
                return (<option value={item}>{item}</option>);
            });

        return (
            <select value={this.state.operator} onChange={this.handleChange}>
                {items}
            </select>
        );
    }
}
