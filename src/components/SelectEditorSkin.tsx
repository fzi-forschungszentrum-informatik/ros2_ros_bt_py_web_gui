import { ChangeEvent, Component } from 'react';

interface SelectEditorSkinProps {
    changeSkin: (skin: string) => void
}

interface SelectEditorSkinState {

}

export class SelectEditorSkin extends Component<SelectEditorSkinProps, SelectEditorSkinState> {
    constructor(props: SelectEditorSkinProps) {
        super(props);

        this.onChange = this.onChange.bind(this);
    }

    onChange(event: ChangeEvent<HTMLSelectElement>) {
        console.log("changing editor skin to " + event.target.value);
        this.props.changeSkin(event.target.value);
    }

    render() {
        return (
            <div>
                <label className="form-inline m-1">
                    <select className="custom-select ml-1"
                        defaultValue="darkmode"
                        onChange={this.onChange}>
                        <option value="darkmode">Dark Editor</option>
                        <option value="light">Light Editor</option>
                    </select>
                </label>
            </div>
        );
    }
}
