import React from "react";
import { useState } from "react";
import {Row, Col} from 'react-bootstrap';

function TaskNote(props) {

    const showImage = () => { // funciton calles the show image function in the parrent component and passes it the image refrence
        props.showImage(props.note.image)
    }

    return ( // the return contains jsx to render a new row in the task notes table in a task component
        <Row className="bottom-line task-note">
            <Col xs={5} className='task-note'><div className='task-note'>{props.note.note}</div></Col>
            <Col xs={1} className='task-note'>{props.note.end_status}</Col>
            <Col xs={2} className='task-note'>{props.note.creator.name}</Col>
            <Col xs={2} className='task-note'>{new Date(`${props.note.timestamp} GMT`).toLocaleString()}</Col>
            <Col xs={2} className='task-note'>{props.note.image? <div className="task-note"><img onClick={showImage} className="noteImage task-note" src={`/api/tasks/image/${props.note.image}`}/></div>:<></>}</Col>
        </Row>
    )
}

export default TaskNote;