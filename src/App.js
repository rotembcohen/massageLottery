import React, { Component } from 'react';
import List from 'antd/lib/list';
import Input from 'antd/lib/input';
import DatePicker from 'antd/lib/date-picker';
import TimePicker from 'antd/lib/time-picker';
import moment from 'moment';
import Button from 'antd/lib/button';
import Form from 'antd/lib/form';
import InputNumber from 'antd/lib/input-number';
import Layout  from 'antd/lib/layout';
import { Row, Col } from 'antd/lib/grid';
const { Header, Footer, Content } = Layout;

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
            currentLottery: null
        };
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.executeLottery = this.executeLottery.bind(this);
    }

    componentDidMount() {
        this.loadCurrentLottery();
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
        let startTimes = [
            this.stringifyDate(this.state.firstDate,this.state.firstTime),
            this.stringifyDate(this.state.secondDate,this.state.secondTime)
        ];
        fetch('/createBatch/',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
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
                    'Accept': 'application/json'
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

    renderItem(item) {
        let itemTime = (new Date(item.startTime)).toLocaleString('en-GB', {timeZone: 'America/New_York'});
        return (<List.Item>{itemTime} {item.winner?item.winner:"Open: "+item.entryCount+" registered"}</List.Item>);
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

        let items = this.state.currentLottery ? this.state.currentLottery.slots : [];
        let currentFinished = this.state.currentLottery ? this.state.currentLottery.isFinished : true;
        let renderExecuteButton = currentFinished ? (<Button onClick={this.executeLottery} type='danger' icon='alert' disabled>Execute</Button>)
                : (<Button onClick={this.executeLottery} type='danger' icon='alert'>Execute</Button>);

        return (
            <div className="App">
                <Layout>
                    <Header className="App-header">
                        <h1 className="App-title">Massage Lottery Admin</h1>
                    </Header>
                    <Content className="Dashboard">
                        <Row>
                            <Col span={12}>
                                <h1>Create</h1>
                                <Form id="CreateForm">
                                    <Form.Item {...formItemLayout} label="Slots Per Day:">
                                        <InputNumber
                                            value={this.state.slotAmount}
                                            onChange={e=>{this.setState({slotAmount:e.target.value})}}
                                        />
                                    </Form.Item>
                                    <Form.Item {...formItemLayout} label="Time Per Slot:">
                                        <InputNumber
                                            value={this.state.slotDuration}
                                            onChange={e=>{this.setState({slotDuration:e.target.value})}}
                                        />
                                    </Form.Item>
                                    <Form.Item {...formItemLayout} label="Location:">
                                        <Input
                                            className="textInput"
                                            value={this.state.location}
                                            onChange={e=>{this.setState({location:e.target.value})}}
                                        />
                                    </Form.Item>
                                    <Form.Item {...formItemLayout} label="First Date:">
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
                                    <Form.Item {...formItemLayout} label="Second Date:">
                                        <DatePicker
                                            value={this.state.secondDate}
                                            onChange={d=>{this.setState({secondDate:d})}}
                                        />
                                        <TimePicker
                                            value={this.state.secondTime}
                                            onChange={d=>{this.setState({secondTime:d})}}
                                            format={"HH:mm"}
                                        />
                                    </Form.Item>
                                    <Button onClick={this.handleSubmit} type="primary" icon='experiment'>Create</Button>
                                </Form>
                            </Col>
                            <Col span={12}>
                                <h1>Manage</h1>
                                {renderExecuteButton}
                                <List
                                    dataSource={items}
                                    renderItem={this.renderItem}
                                />
                            </Col>
                        </Row>
                    </Content>
                    <Footer/>
                </Layout>
            </div>
        );
    }

}

export default App;