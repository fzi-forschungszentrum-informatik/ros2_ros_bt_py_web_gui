import React, { Component, Fragment } from "react";

type SpacerProps = Record<string, never>;

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
