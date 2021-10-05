import {Row, Col} from 'react-bootstrap';

const Transaction = (props) => {
    console.log(props)
    return ( // render a row in the parent table for a transaction
        <Row className="bottom-line">
            <Col>
                {props.transaction.assigned_to[0].name}
            </Col>
            <Col>
                ${props.transaction.ballance}
            </Col>
            <Col>
                ${props.transaction.ammount}
            </Col>
            <Col>
                {props.transaction.settled? "False":"True"}
            </Col>
        </Row>
    )
}
export default Transaction