import React, { Component } from 'react';
import Table from 'antd/lib/table';
import Input from 'antd/lib/input';
import DatePicker from 'antd/lib/date-picker';
import TimePicker from 'antd/lib/time-picker';
import moment from 'moment';
import Button from 'antd/lib/button';
import Form from 'antd/lib/form';
import InputNumber from 'antd/lib/input-number';
import Layout  from 'antd/lib/layout';
import { Row, Col } from 'antd/lib/grid';
import Modal from 'antd/lib/modal';
import Switch from 'antd/lib/switch';
const { Header, Footer, Content } = Layout;

function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

class App extends Component {
    constructor() {
        super();

        const TUESDAY = 2;

        let firstDate = this.getWeekday(TUESDAY);
        let secondDate = moment(firstDate).add(2, 'days');

        this.state = {
            slotAmount: 12,
            slotDuration: 20,
            location: 'Conference Room 3A',
            firstDate: firstDate,
            firstTime: moment().hour(11).minutes(0).seconds(0),
            secondDate: secondDate,
            secondTime: moment().hour(12).minutes(0).seconds(0),
            currentLottery: null,
            modalVisible: false,
            secondDateEnabled: true
        };
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.executeLottery = this.executeLottery.bind(this);
    }

    componentDidMount() {
        this.loadCurrentLottery();
    }

    showModal = () => { this.setState({modalVisible: true}) }

    handleOk = (e) => {
        this.executeLottery();
        this.setState({
            modalVisible: false,
        });
    }
    handleCancel = (e) => {
        this.setState({
            modalVisible: false,
        });
    }

    loadCurrentLottery() {
        fetch('/lottery/18/')
            .then(response=>response.json())
            .then(data => this.setState({currentLottery:data}))
            .catch(error => console.error('Errors', error))
    }

    getWeekday(dayINeed) {
        let today = moment().isoWeekday();

        if (today <= dayINeed) {
            return moment().isoWeekday(dayINeed);
        } else {
            return moment().add(1, 'weeks').isoWeekday(dayINeed);
        }
    }

    handleChange(event) {
        this.setState({value: event.target.value});
    }

    handleSubmit() {
        let startTimes = [this.stringifyDate(this.state.firstDate,this.state.firstTime)];
        if (this.state.secondDateEnabled) {
            startTimes.push(this.stringifyDate(this.state.secondDate,this.state.secondTime));
        }

        fetch('/createBatch/',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: JSON.stringify({
                    startTimes: startTimes,
                    slotAmount: this.state.slotAmount,
                    slotDuration: this.state.slotDuration,
                    location: this.state.location
                })
            })
            .then(response => {
                console.log(response.status);
                this.loadCurrentLottery();
            })
            .catch(error => console.error('Error:', error))
    }

    executeLottery() {
        fetch('/lottery/18/',
            {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: JSON.stringify({
                    isFinished: true
                })
            })
            .then(response => {
                console.log(response.status);
                this.loadCurrentLottery();
            })
            .catch(error => console.error('Error:', error))
    }

    stringifyDate(date, time) {
        return date.format('YYYY-MM-DD') + 'T' + time.format('HH:mm') + ':00.00000Z';
    }

    render() {
        const formItemLayout = {
          labelCol: {
            xs: { span: 12 },
            sm: { span: 4 },
          },
          wrapperCol: {
            xs: { span: 24 },
            sm: { span: 16 },
          },
        };

        //Table
        const columns = [{
            title: "Date",
            dataIndex: "startTime",
            key: "startTime",
            render: (d) => new Date(d).toLocaleDateString('en-US', {
                timeZone: 'America/New_York',
                month: 'numeric',
                day: 'numeric'
            })
        },{
            title: "Time",
            dataIndex: "startTime",
            key: "startTime",
            render: (d) => new Date(d).toLocaleTimeString('en-GB', {
                timeZone: 'America/New_York',
                hour: 'numeric',
                minute: 'numeric'
            })
        },{
            title: "Entered",
            dataIndex: "entryCount",
            key: "entryCount"
        },{
            title: "Winner",
            dataIndex: "winner",
            key: "winner"
        }];

        let items = this.state.currentLottery ? this.state.currentLottery.slots : [];
        let currentFinished = this.state.currentLottery ? this.state.currentLottery.isFinished : true;
        let renderExecuteButton = currentFinished ? (<Button type='danger' icon='alert' disabled>Execute</Button>)
                : (<Button onClick={this.showModal} type='danger' icon='alert'>Execute</Button>);

        return (
            <div className="App">
                <Layout>
                    <Header className="App-header">
                        <h1 className="App-title">Massage Lottery Admin</h1>
                    </Header>
                    <Modal
                        title="Are you sure?"
                        visible={this.state.modalVisible}
                        onOk={this.handleOk}
                        onCancel={this.handleCancel}
                    >
                        <p>Lottery will be closed and winners will be informed by email!</p>
                    </Modal>
                    <Content className="Dashboard">
                        <Col className="col span_1_of_2">
                            <Form id="CreateForm">
                                <Form.Item className="formItem" {...formItemLayout} label="Slots Per Day:">
                                    <InputNumber
                                        min = {1}
                                        max = {50}
                                        defaultValue={this.state.slotAmount}
                                        onChange={val=>{this.setState({slotAmount:val})}}
                                    />
                                </Form.Item>
                                <Form.Item className="formItem" {...formItemLayout} label="Time Per Slot:">
                                    <InputNumber
                                        min = {1}
                                        max = {999}
                                        defaultValue={this.state.slotDuration}
                                        onChange={val=>{this.setState({slotDuration:val})}}
                                    /> &nbsp; minutes
                                </Form.Item>
                                <Form.Item className="formItem" {...formItemLayout} label="Location:">
                                    <Input
                                        className="textInput"
                                        value={this.state.location}
                                        onChange={e=>{this.setState({location:e.target.value})}}
                                    />
                                </Form.Item>
                                <Form.Item className="formItem" {...formItemLayout} label="First Date:">
                                    <DatePicker
                                        value={this.state.firstDate}
                                        onChange={d=>{this.setState({firstDate:d})}}
                                    />
                                    <TimePicker
                                        value={this.state.firstTime}
                                        onChange={d=>{this.setState({firstTime:d})}}
                                        format={"HH:mm"}
                                    />
                                </Form.Item>
                                <Form.Item className="formItem" {...formItemLayout} label="Second Date:">
                                    <DatePicker
                                        value={this.state.secondDate}
                                        onChange={d=>{this.setState({secondDate:d})}}
                                        disabled={!this.state.secondDateEnabled}
                                    />
                                    <TimePicker
                                        value={this.state.secondTime}
                                        onChange={d=>{this.setState({secondTime:d})}}
                                        format={"HH:mm"}
                                        disabled={!this.state.secondDateEnabled}
                                    />
                                    &nbsp; &nbsp;
                                    <Switch
                                        onChange={(val) => this.setState({secondDateEnabled:val})}
                                        value={this.state.secondDateEnabled}
                                        defaultChecked={this.state.secondDateEnabled}
                                    />
                                </Form.Item>
                                <div className="ButtonContainer">
                                    <Button onClick={this.handleSubmit} type="primary" icon='experiment'>Create</Button>
                                </div>
                            </Form>
                        </Col>
                        <Col className="col span_1_of_2">
                            <Row className="ButtonContainer" id="ExecuteButtonContainer">
                                {renderExecuteButton}
                            </Row>
                            <Table
                                className="ItemTable"
                                dataSource={items}
                                columns={columns}
                                pagination={{pageSize:12}}
                            />
                        </Col>
                    </Content>
                    <Footer/>
                </Layout>
            </div>
        );
    }

}

export default App;