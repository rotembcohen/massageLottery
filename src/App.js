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

class App extends Component {
    constructor() {
        super();
        this.state = {
            value: null,
            data: null
        };
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleChange(event) {
        this.setState({value: event.target.value});
    }

    handleSubmit() {
        fetch('http://localhost:8000/lottery/' + this.state.value + '/')
            .then(results => {
                return results.json()
            }).then(data => {
                this.setState({data:data})
        })
    }

    renderItem(item) {
        let itemTime = (new Date(item.startTime)).toLocaleString('en-GB', {timeZone: 'UTC'});
        return (<List.Item>{itemTime} {item.winner}</List.Item>);
    }

    render() {
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
                            <div>
                                <DatePicker defaultValue={moment().add(1,'days')} />
                                <DatePicker defaultValue={moment().add(3,'days')} />
                            </div>
                            <div>
                                <TimePicker defaultValue={moment()} format={"HH:mm"} />
                                <TimePicker defaultValue={moment()} format={"HH:mm"} />
                            </div>
                            <div>
                                <Input defaultValue="slots" style={{width:200}}/>
                                <Input defaultValue="slot time" style={{width:200}}/>
                                <Input defaultValue="Location" style={{width:200}}/>
                            </div>
                            <div>
                                <Button  type="primary">Create</Button>
                            </div>
                        </Col>
                        <Col span={10}>
                            <form onSubmit={this.handleSubmit}>
                                Get slot count for
                                <Input
                                    size="default"
                                    id="slotIdInput"
                                    onChange={this.handleChange}
                                />
                                <Button type="primary" onClick={()=>this.handleSubmit()}>Get List</Button>
                                <Input value={this.state.data ? this.state.data.location : null} />
                            </form>
                            <div className="List">
                                <List
                                    dataSource={items}
                                    renderItem={this.renderItem}
                                />
                            </div>
                        </Col>
                    </Row>
                </div>

            </div>
        );
    }

}

export default App;
