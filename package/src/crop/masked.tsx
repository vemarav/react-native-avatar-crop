/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

// @flow
import {ViewProps} from 'react-native';
import * as React from 'react';
import {View, StyleSheet, requireNativeComponent} from 'react-native';

interface MaskedViewProps extends ViewProps {
  children: React.ReactNode;
  maskElement: React.ReactElement<any>;
  androidRenderingMode?: 'software' | 'hardware';
}

const RNCMaskedView = requireNativeComponent<any>('RNCMaskedView');

export default class MaskedView extends React.Component<MaskedViewProps> {
  _hasWarnedInvalidRenderMask = false;

  render(): React.ReactNode {
    const {maskElement, children, ...otherViewProps} = this.props;

    if (!React.isValidElement(maskElement)) {
      if (!this._hasWarnedInvalidRenderMask) {
        console.warn(
          'MaskedView: Invalid `maskElement` prop was passed to MaskedView. ' +
            'Expected a React Element. No mask will render.',
        );
        this._hasWarnedInvalidRenderMask = true;
      }
      return <View {...otherViewProps}>{children}</View>;
    }

    return (
      <RNCMaskedView {...otherViewProps}>
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          {maskElement}
        </View>
        {children}
      </RNCMaskedView>
    );
  }
}
