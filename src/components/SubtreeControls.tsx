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
import { ChangeEvent, Component, Fragment } from "react";
import ROSLIB from "roslib";
import { BoolMsg } from "../types/types";
import { uuid } from "../utils";
import { SetBoolRequest, SetBoolResponse } from "../types/services/SetBool";

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
  subtree_status_service: ROSLIB.Service<SetBoolRequest, SetBoolResponse>;
  publishSubtreesID: string;

  constructor(props: SubtreeControlsProps) {
    super(props);

    this.state = {
      publishing_subtrees: false,
    };

    this.subtree_status_service = new ROSLIB.Service({
      ros: props.ros,
      name: props.bt_namespace + "debug/set_publish_subtrees",
      serviceType: "std_msgs/srv/SetBool",
    });
    this.publishSubtreesID = "publish_subtrees_" + uuid();

    this.handlePubSubtreesChange = this.handlePubSubtreesChange.bind(this);
  }

  componentDidMount() {}

  componentWillUnmount() {}

  onNewSubtreeSettings(msg: BoolMsg) {
    this.setState({
      publishing_subtrees: msg.data,
    });
  }

  handlePubSubtreesChange(event: ChangeEvent<HTMLInputElement>) {
    const enable = event.target.checked;
    this.subtree_status_service.callService(
      { data: enable } as SetBoolRequest,
      (response: SetBoolResponse) => {
        if (response.success) {
          this.props.onPublishingSubtreesChange(enable);
          this.setState({ publishing_subtrees: enable });
        }
      }
    );
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
