import * as React from 'react';
import * as ReactDOM from 'react-dom';
import JSONInput from 'react-json-editor-ajrm';
import locale from 'react-json-editor-ajrm/locale/en';
import { NodePluginData } from './code';
import { FigmaMessage, UIMessage } from "./message";
import './ui.css';

declare function require(path: string): any

interface JSONInputResponse {
  plainText: string //	A string representation of then content which includes linebreaks and indentation. Great to console.log()
  markupText: string //	A string representation of the auto-generated markup used to render content.
  json: string //	A JSON.stringify version of content.
  jsObject: Object //	A javascript object version of content. Will return undefined if the content's syntax is incorrect.
  lines: number //	Number of lines rendered for content to be displayed.
  error: string //
}

type State = {
  currentNode?: NodePluginData
  reset: boolean
  saving: boolean
  canSave: boolean
  changed: boolean
  currentNodePluginData?: string
  updateJsonInputMs: number
  childrenHavePhysics: boolean
  errorReason: string | undefined
}

class App extends React.Component<{}, State> {
  state: State = {
    reset: false,
    canSave: false,
    changed: false,
    saving: false,
    updateJsonInputMs: 800,
    childrenHavePhysics: false,
    errorReason: undefined
  }

  textbox: HTMLInputElement

  constructor(props: any) {
    super(props)


    // set up routing
    window.onmessage = (event) => {

      this.onFigmaMessage(event)
    }
  }

  countRef = (element: HTMLInputElement) => {
    if (element) element.value = '5'
    this.textbox = element
  }

  render() {
    return <>
      <div>
        <p>Type: {this.state.currentNode?.type}</p>
        <p>Name: {this.state.currentNode?.name}</p>
        <p>Id: {this.state.currentNode?.id}</p>
        <p>ParentId: {this.state.currentNode?.parentId}</p>
        <JSONInput
          id={this.state.currentNode?.name || ''}
          reset={this.state.reset}
          onChange={this.onChange}
          placeholder={{
            ...(this.state.currentNode?.pluginData || {})
          }}
          error={!!this.state.errorReason ? {
            reason: this.state.errorReason
          } : undefined }
          locale      = { locale }
          height      = '250px'
          width       = '350px'
          style={{
            outerBox: {
              marginBottom: '10px'
            },
            contentBox: {
              flex: ""
            }
          }}
          waitAfterKeyPress={this.state.updateJsonInputMs}
        />
      </div>
      <button id="save" onClick={this.onSave} disabled={!this.state.canSave}>Save</button>
      <button onClick={this.onReset} disabled={this.state.saving || !this.state.changed}>Reset</button>
    </>
  }

  onChange = (response: JSONInputResponse) => {
    this.setState({
      errorReason: undefined,
      canSave: !response.error,
      changed: true,
      currentNodePluginData: response.json
    })

  }

  onSave = () => {
    // todo:
    // 1. Get the data from the json
    const data = this.state.currentNodePluginData

    /// a bit complex to ensure that the save get's the latest changes
    this.setState({
      saving: true,
      updateJsonInputMs: 100
    }, () => {
      // ensure that the form received the new data
      setTimeout(() => {
        // 2. post message to the ui
        parent.postMessage({
          pluginMessage: {
            type: UIMessage.SAVE_DATA,
            data: data
          }
        }, '*')

        this.setState({
          canSave: false,
          saving: false,
          changed: false,
          updateJsonInputMs: 800,
          childrenHavePhysics: undefined
        })
      }, 200)

    })
  }

  onReset= () => {
    // update the json plugin with the placeholder

    this.setState({
      reset: true
    }, () => {
      this.setState({
        canSave: false,
        saving: false,
        changed: false,
        reset: false,
        currentNodePluginData: undefined
      })
    })
  }


  // Helpers to respond to figma messages

  onFigmaMessage = (event: any) => {
    switch (event.data.pluginMessage.messageId) {
      case FigmaMessage.NODE_SELECTED:
        this.onNodeSelected(event.data.pluginMessage.data)
       break
      default:
        console.error('unknown message', event.data.pluginMessage)
        break
    }
  }

  onNodeSelected(data: NodePluginData) {
    console.log(data.childrenHavePhysics)
    this.setState({
      currentNode: data,
      canSave: false,
      changed: false,
      currentNodePluginData: undefined,
      childrenHavePhysics: data.childrenHavePhysics
    })
  }
}

ReactDOM.render(<App />, document.getElementById('react-page'))