import React, { Component } from "react";
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
