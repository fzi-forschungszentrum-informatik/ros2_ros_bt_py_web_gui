import { Component, Fragment } from "react";

interface SpacerProps {}

export class Spacer extends Component<SpacerProps> {
  constructor(props: SpacerProps) {
    super(props);
  }

  render() {
    return (
      <Fragment>
        <div className="spacer"></div>
      </Fragment>
    );
  }
}
