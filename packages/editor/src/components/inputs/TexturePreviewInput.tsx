import React, { Fragment } from 'react'

import { AssetLoader } from '@xrengine/engine/src/assets/classes/AssetLoader'
import { ImageFileTypes, VideoFileTypes } from '@xrengine/engine/src/assets/constants/fileTypes'
import { AssetClass } from '@xrengine/engine/src/assets/enum/AssetClass'

import { Stack } from '@mui/material'

import { ItemTypes } from '../../constants/AssetTypes'
import FileBrowserInput from './FileBrowserInput'
import { ImageContainer } from './ImagePreviewInput'
import InputGroup from './InputGroup'

/**
 * VideoInput used to render component view for video inputs.
 *
 * @param       {function} onChange
 * @param       {any} rest
 * @constructor
 */
export function TextureInput({ onChange, ...rest }) {
  return (
    <FileBrowserInput
      acceptFileTypes={[...ImageFileTypes, ...VideoFileTypes]}
      acceptDropItems={[...ItemTypes.Images, ...ItemTypes.Videos]}
      onChange={onChange}
      {...rest}
    />
  )
}

export default function TexturePreviewInput({ value, onChange, ...rest }) {
  const previewStyle = {
    maxWidth: '128px',
    maxHeight: '128px',
    width: 'auto',
    height: 'auto'
  }
  const { preview } = rest
  const src = preview ?? value
  const showPreview =
    preview !== undefined ||
    (typeof value === 'string' && [AssetClass.Image, AssetClass.Video].includes(AssetLoader.getAssetClass(value)))
  return (
    <ImageContainer>
      <Stack>
        {showPreview && (
          <Fragment>
            <TextureInput value={src} onChange={onChange} />
            {(typeof preview === 'string' ||
              (typeof value === 'string' && AssetLoader.getAssetClass(value) === AssetClass.Image)) && (
              <img src={src} style={previewStyle} alt="" crossOrigin="anonymous" />
            )}
            {typeof value === 'string' && AssetLoader.getAssetClass(value) === AssetClass.Video && (
              <video src={src} style={previewStyle} />
            )}
          </Fragment>
        )}
      </Stack>
    </ImageContainer>
  )
}

export function TexturePreviewInputGroup({ name, label, value, onChange, ...rest }) {
  return (
    <InputGroup name={name} label={label} {...rest}>
      <TexturePreviewInput value={value} onChange={onChange} />
    </InputGroup>
  )
}
