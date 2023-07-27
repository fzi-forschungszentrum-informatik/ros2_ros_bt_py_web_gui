import { ChangeEvent, Component, Fragment } from "react";
import ROSLIB from "roslib";
import { BoolMsg } from "../types/types";
import { uuid } from "../utils";

interface SubtreeControlsProps {
  ros: ROSLIB.Ros;
  bt_namespace: string;
  onError: (error_msg: string) => void;
  onPublishingSubtreesChange: (editable: boolean) => void;
}

interface SubtreeControlsState {
  publishing_subtrees: boolean;
}

export class SubtreeControls extends Component<
  SubtreeControlsProps,
  SubtreeControlsState
> {
  subtree_status_sub: ROSLIB.Topic<BoolMsg>;
  publishSubtreesID: string;

  constructor(props: SubtreeControlsProps) {
    super(props);

    this.state = {
      publishing_subtrees: false,
    };

    this.subtree_status_sub = new ROSLIB.Topic({
      ros: props.ros,
      name: props.bt_namespace + "publish_subtrees",
      messageType: "std_msgs/msg/Bool",
    });
    this.publishSubtreesID = "publish_subtrees_" + uuid();

    this.handlePubSubtreesChange = this.handlePubSubtreesChange.bind(this);
  }

  componentDidMount() {
    this.subtree_status_sub.subscribe(this.onNewSubtreeSettings);
  }

  componentWillUnmount() {
    this.subtree_status_sub.unsubscribe(this.onNewSubtreeSettings);
  }

  onNewSubtreeSettings(msg: BoolMsg) {
    this.setState({
      publishing_subtrees: msg.data,
    });
  }

  handlePubSubtreesChange(event: ChangeEvent<HTMLInputElement>) {
    const enable = event.target.checked;
    this.props.onPublishingSubtreesChange(enable);
    this.setState({ publishing_subtrees: enable });
  }

  render() {
    return (
      <Fragment>
        <div className="form-check m-1">
          <input
            type="checkbox"
            id={this.publishSubtreesID}
            className="form-check-input"
            checked={this.state.publishing_subtrees}
            onChange={this.handlePubSubtreesChange}
          />
          <label className="form-check-label" htmlFor={this.publishSubtreesID}>
            Publish Subtrees
          </label>
        </div>
      </Fragment>
    );
  }
}
