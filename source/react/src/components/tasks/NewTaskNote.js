import {useState} from 'react';
import { Button } from 'react-bootstrap';

const NewTaskNote = (props) => {
    const [note, setNote] = useState('')
    const [endStatus, SetStatus] = useState(props.task.status)
    const [editor, setEditor] = useState(false)
    const [recept, setRecept] = useState(0)

    const handleRecept = (e) => { // the handler for a spend amount
        setRecept(e.target.value)
    }

    const toggleEditor = () => { // toggle the edit mode
        setEditor(!editor)
    }

    // the state object and toggler for adding or changing an image on a note
    const [imageEditor, setImageEditor] = useState(false)
    const toggleImageEditor = () => {
        setImageEditor(!imageEditor)
    }


    // the note image state object as well as what is needed to show the chosen image in the editor
    const [noteImage, setNoteImage] = useState()
    const [imageURL, setImageURL] = useState('')
    const handleImage = (e) => {
        setNoteImage(e.target.files[0])
        setImageURL(URL.createObjectURL(e.target.files[0]))
        toggleImageEditor()
    }
    
    // closes the image editor and clears the image
    const cancelImage = () => {
        toggleImageEditor()
        setImageURL('')
        setNoteImage()
    }

    // resets the new note component
    const clearNote = () => {
        setNote('')
        SetStatus(props.task.status)
        setImageURL('')
        setNoteImage()
        setRecept(0)
    }

    // clears the note and closes the editor
    const cancelNote = () => {
        setNote('')
        SetStatus(props.task.status)
        toggleEditor()
        setImageURL('')
        setNoteImage()
    }

    // the handler to change the note text
    const handleNoteChange = (e) => {
        setNote(e.target.value)
    }

    // the handler to change the end status of the task
    const handleStatusChange = (e) => {
        SetStatus(e.target.value)
    }
    
    // validate the note then submit the new note to the server
    const submitNote = async() => {
        if (recept > 0 && imageURL === '') {
            alert('you must attach an image of the recept')
            return
        }
        let response = await props.createNote( note, endStatus, noteImage, recept);
        if (response) {
            cancelNote()
        }
    }



    return( // the return method holds the jsx to control rendering of the component
        <>
            {editor ? // if edit mode is true render the new note editor
                <div className='taskNote'>
                    <input
                        type='text'
                        name='note'
                        placeholder="note"
                        value={note}
                        onChange={handleNoteChange}
                    />
                    <label>Staus:</label>
                    <select
                        name='endStatus'
                        onChange={handleStatusChange}
                        value={endStatus}
                    >
                        {['admin', 'manager', 'supervisor'].includes(props.user.role) ?
                            <>
                                <option value='created'>Created</option>
                                <option value='assigned'>Assigned</option>
                                <option value='regected'>Regected</option>
                                <option value='verified'>Verified</option>
                            </>
                        :   <></>
                        }
                        <option value='viewed'>Viewed</option>
                        <option value='in_progress'>In Progress</option>
                        <option value='on_hold'>On Hold</option>
                        <option value='submited'>Submited</option> 
                        {(props.task.requires_verification 
                                    && ['admin', 'manager'].includes(props.user.role)) 
                                    || props.task.requires_verification === false 
                            ? // if the task requires verification only render the completed option if the user is a manager or administrator
                                <option value='completed'>Completed</option>
                            :
                                <></>
                        }
                    </select>
                    {(props.task.budget && (props.task.budget.ballance > 0)) ? // if there is a ballance avlible to the task render the spend sub menu
                            <>purchase ammount:
                                <input
                                    type="number"
                                    min="0"
                                    max={props.task.budget.ballance}
                                    step=".01"
                                    name='recept'
                                    value={recept}
                                    onChange={handleRecept}
                                />
                            </>
                        : // if there is not any ballance avalible do not render any extra
                            <></>
                    }
                    {noteImage
                        ? // if there is an image chosen render the image
                            <div>
                                <img className="noteImage" src={imageURL}/>
                            </div>
                        : // if no image render nothing extra
                            <></>
                    }
                    {imageEditor === false ? // if image editor is false render the add/change image button
                        <Button
                            className="btn btn-primary"
                            name="addImage"
                            onClick={toggleImageEditor}
                        >add/replace Image </Button>
                    : // if image editor is true render the image picker sub menue
                        <div className="imageEditor">
                            <input type='file'
                                   name='noteImage'
                                   onChange={handleImage}
                                   accept="image/png, image/jpeg, image/jpg"
                            />
                        <Button onClick={cancelImage}>Cancel Image</Button>
                        </div>
                    }

                    <div>
                        <Button
                            className='btn btn-primary'
                            name='submitNote'
                            onClick={submitNote}
                        >Submit</Button>
                        <Button
                            className='btn btn-primary'
                            name='clearNote'
                            onClick={clearNote}
                        >Clear</Button>
                        <Button
                            className='btn btn-primary'
                            name='cancelNote'
                            onClick={cancelNote}
                        >Cancel</Button>
                    </div>

                </div>
                : // if editor is false only render the add note button
                <Button
                    className="btn btn-primary"
                    name="addNote"
                    onClick={toggleEditor}
                >Take Action/Add Note</Button>
            }
        </>
    )
}
export default NewTaskNote;