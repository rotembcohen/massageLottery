import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import List from 'antd/lib/list';
import Input from 'antd/lib/input';
import { Row, Col } from 'antd/lib/grid';
import DatePicker from 'antd/lib/date-picker';
import TimePicker from 'antd/lib/time-picker';
import moment from 'moment';
import Button from 'antd/lib/button';
import Form from 'antd/lib/form';
import InputNumber from 'antd/lib/input-number';

class App extends Component {
    constructor() {
        super();

        const TUESDAY = 2;

        let firstDate = this.getWeekday(TUESDAY);
        let secondDate = moment(firstDate).add(2, 'days');

        this.state = {
            value: null,
            data: null,
            slotAmount: 12,
            slotDuration: 20,
            location: 'Conference Room 3A',
            firstDate: firstDate,
            firstTime: moment().hour(11).minutes(0).seconds(0),
            secondDate: secondDate,
            secondTime: moment().hour(12).minutes(0).seconds(0)
        };
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
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
        fetch('http://localhost:8000/createBatch/',
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
            }
            )
            .then(response => {
                console.log(response.status)
            })
            .catch(error => console.error('Error:', error))
    }

    stringifyDate(date, time) {
        return date.format('YYYY-MM-DD') + 'T' + time.format('HH:mm') + ':00.00000Z';
    }

    renderItem(item) {
        let itemTime = (new Date(item.startTime)).toLocaleString('en-GB', {timeZone: 'UTC'});
        return (<List.Item>{itemTime} {item.winner}</List.Item>);
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
        let items = this.state.data ? this.state.data.slots : [];

        return (
            <div className="App">
                <header className="App-header">
                    <img src={logo} className="App-logo" alt="logo" />
                    <h1 className="App-title">Welcome to React</h1>
                </header>
                <div className="Dashboard">
                    <Row justify="center">
                        <Col span={10} style={{margin: 10}}>
                            <h1>Create</h1>
                            <Form align="space-between">
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
                                <Button onClick={this.handleSubmit} type="primary">Create</Button>
                            </Form>
                        </Col>
                    </Row>
                </div>

            </div>
        );
    }

}

export default App;

/*
<Col span={10}>
    <form onSubmit={this.handleSubmit}>
        Get slot count for
        <Input
            size="default"
            id="slotIdInput"
            onChange={this.handleChange}
        />
        <Button type="primary" onClick={()=>this.handleSubmit()}>Get List</Button>
    </form>
    <div className="List">
        <List
            dataSource={items}
            renderItem={this.renderItem}
        />
    </div>
</Col>
 */