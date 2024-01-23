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
import { Component } from "react";
import { Error } from "../types/types";

interface ErrorHistoryProps {
  sorting_asc: boolean;
  history: Error[];
  clearErrors: () => void;
  changeSorting: (_: boolean) => void;
}

export class ErrorHistory extends Component<ErrorHistoryProps> {
  constructor(props: ErrorHistoryProps) {
    super(props);
  }

  render() {
    let buttons = null;
    let sorting_icon = <span aria-hidden="true" className="fas fa-sort-up" />;
    if (this.props.sorting_asc) {
      sorting_icon = <span aria-hidden="true" className="fas fa-sort-down" />;
    }
    if (this.props.history && this.props.history.length > 0) {
      buttons = (
        <div className="clear-error">
          <button
            className="btn btn-primary m-1"
            onClick={() => this.props.changeSorting(!this.props.sorting_asc)}
          >
            {sorting_icon}
          </button>
          <button
            className="btn btn-primary m-1"
            onClick={this.props.clearErrors}
          >
            Clear errors
          </button>
        </div>
      );
    }
    const error_history = this.props.history.slice(0);
    if (!this.props.sorting_asc) {
      error_history.reverse();
    }
    return (
      <ul className="w-100 list-group">
        {buttons}
        {error_history.map((errorEntry) => {
          return (
            <li className="list-group-item" key={errorEntry.id}>
              <p>
                <small className="message-date">
                  {new Date(errorEntry.time).toTimeString()}
                </small>
                <br />
                <span>{errorEntry.text}</span>
              </p>
            </li>
          );
        })}
      </ul>
    );
  }
}
