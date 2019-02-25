import './App.css'
import '@elastic/eui/dist/eui_theme_light.css'

import React, { Component } from 'react'
import {
  HashRouter, Switch, Route, Link
} from 'react-router-dom'
import { EuiPage, EuiPageSideBar, EuiImage } from '@elastic/eui'

import logo from './logo.png'
import StartPage from './pages/Start'
import EditPage from './pages/Edit'

export default class App extends Component {
  static randomContent = [
    {
      id: 1,
      text: 'some random text',
      status: 'this status',
      url: 'http://localhost:9000/minio/transcriptions/858048.wav',
      createdAt: '2019-02-06T09:04:39.041+0000',
      updatedAt: '2019-02-06T09:04:39.041+0000'
    },
    {
      id: 2,
      text: 'some text',
      status: 'some status',
      url: 'http://localhost:9000/minio/transcriptions/858058.wav',
      createdAt: '2019-02-06T09:05:39.041+0000',
      updatedAt: '2019-02-06T09:05:39.041+0000'
    }
  ]

  render() {
    return (
      <HashRouter>
        <EuiPage>
          <EuiPageSideBar>
            <Link to="/">
              <EuiImage
                className="logo"
                size="m"
                alt="logo"
                url={logo}
                allowFullScreen
              />
            </Link>
          </EuiPageSideBar>
          <Switch>
            <Route exact path="/" component={StartPage} />
            <Route path="/edit/:id" component={EditPage} />
          </Switch>
        </EuiPage>
      </HashRouter>
    )
  }
}
