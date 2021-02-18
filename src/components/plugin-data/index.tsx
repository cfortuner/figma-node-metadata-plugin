import React from 'react';
import JSONInput from 'react-json-editor-ajrm';
import locale from 'react-json-editor-ajrm/locale/en';
import { NodePluginData } from '../../code';



type Props = {
  pluginData?: NodePluginData
}

class PluginDataComponent extends React.Component<Props, {}> {
  componentDidUpdate(newProps: Props) {
    console.log(newProps)
  }

  render() {
    console.log(this.props.pluginData?.pluginData)
    return <div>
      <p>
        Type: {this.props.pluginData?.type || ''}
      </p>
      <p>
        Name: {this.props.pluginData?.name || ''}
      </p>
      <JSONInput
        id={this.props.pluginData?.name || ''}
        placeholder={this.props.pluginData?.pluginData || {}}
        locale      = { locale }
        height      = '250px'
        width = '300px'
      />

    </div>
  }
}

export { PluginDataComponent as PluginData };

