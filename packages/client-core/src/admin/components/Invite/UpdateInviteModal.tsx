import classNames from 'classnames'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import InputSelect, { InputMenuItem } from '@etherealengine/client-core/src/common/components/InputSelect'
import InputText from '@etherealengine/client-core/src/common/components/InputText'
import { InviteInterface } from '@etherealengine/common/src/interfaces/Invite'
import Button from '@etherealengine/ui/src/Button'
import Checkbox from '@etherealengine/ui/src/Checkbox'
import Container from '@etherealengine/ui/src/Container'
import DialogTitle from '@etherealengine/ui/src/DialogTitle'
import FormControlLabel from '@etherealengine/ui/src/FormControlLabel'
import FormGroup from '@etherealengine/ui/src/FormGroup'
import Icon from '@etherealengine/ui/src/Icon'
import IconButton from '@etherealengine/ui/src/IconButton'
import Tab from '@etherealengine/ui/src/Tab'
import Tabs from '@etherealengine/ui/src/Tabs'
import TextField from '@etherealengine/ui/src/TextField'

import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment'
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'

import { NotificationService } from '../../../common/services/NotificationService'
import { emailRegex, phoneRegex } from '../../../social/services/InviteService'
import DrawerView from '../../common/DrawerView'
import { AdminInstanceService, useAdminInstanceState } from '../../services/InstanceService'
import { AdminInviteService } from '../../services/InviteService'
import { AdminLocationService, useAdminLocationState } from '../../services/LocationService'
import { AdminSceneService, useAdminSceneState } from '../../services/SceneService'
import { AdminUserService, useUserState } from '../../services/UserService'
import styles from '../../styles/admin.module.scss'

interface Props {
  open: boolean
  onClose: () => void
  invite: InviteInterface
}

const INVITE_TYPE_TAB_MAP = {
  0: 'new-user',
  1: 'location',
  2: 'instance',
  3: 'friend',
  4: 'group',
  5: 'party'
}

const UpdateInviteModal = ({ open, onClose, invite }: Props) => {
  const [inviteTypeTab, setInviteTypeTab] = useState(0)
  const [textValue, setTextValue] = useState('')
  const [makeAdmin, setMakeAdmin] = useState(false)
  const [oneTimeUse, setOneTimeUse] = useState(true)
  const [locationId, setLocationId] = useState('')
  const [instanceId, setInstanceId] = useState('')
  const [userInviteCode, setUserInviteCode] = useState('')
  const [spawnPointUUID, setSpawnPointUUID] = useState('')
  const [setSpawn, setSetSpawn] = useState(false)
  const [spawnTypeTab, setSpawnTypeTab] = useState(0)
  const [timed, setTimed] = useState(false)
  const [startTime, setStartTime] = useState<Date | null | undefined>(null)
  const [endTime, setEndTime] = useState<Date | null | undefined>(null)
  const { t } = useTranslation()
  const adminLocationState = useAdminLocationState()
  const adminInstanceState = useAdminInstanceState()
  const adminUserState = useUserState()
  const adminSceneState = useAdminSceneState()
  const adminLocations = adminLocationState.locations
  const adminInstances = adminInstanceState.instances
  const adminUsers = adminUserState.users
  const spawnPoints = adminSceneState.singleScene?.scene?.entities.value
    ? Object.entries(adminSceneState.singleScene.scene.entities.value).filter(([, value]) =>
        value.components.find((component) => component.name === 'spawn-point')
      )
    : []

  useEffect(() => {
    AdminLocationService.fetchAdminLocations()
    AdminInstanceService.fetchAdminInstances()
    AdminUserService.setSkipGuests(true)
    AdminUserService.fetchUsersAsAdmin()
    setInviteTypeTab(
      invite.inviteType === 'new-user'
        ? 0
        : invite.inviteType === 'location'
        ? 1
        : invite.inviteType === 'instance'
        ? 2
        : 0
    )
    if (invite.token) setTextValue(invite.token)
    if (invite.inviteeId) {
      const userMatch = adminUsers.find((user) => user.id.value === invite.inviteeId)
      if (userMatch && userMatch.inviteCode.value) setTextValue(userMatch.inviteCode.value)
      else setTextValue('')
    }
    if (invite.makeAdmin) setMakeAdmin(Boolean(invite.makeAdmin))
    if (invite.deleteOnUse) setOneTimeUse(Boolean(invite.deleteOnUse))
    if (invite.inviteType === 'location' && invite.targetObjectId)
      handleLocationChange({ target: { value: invite.targetObjectId } })
    if (invite.inviteType === 'instance' && invite.targetObjectId)
      handleInstanceChange({ target: { value: invite.targetObjectId } })
    if (invite.spawnType) {
      setSetSpawn(true)
      if (invite.spawnType === 'inviteCode' && invite.spawnDetails) {
        setSpawnTypeTab(0)
        setUserInviteCode(
          typeof invite.spawnDetails === 'string'
            ? JSON.parse(invite.spawnDetails).inviteCode
            : invite.spawnDetails.inviteCode
        )
      }
      if (invite.spawnType === 'spawnPoint' && invite.spawnDetails) {
        setSpawnTypeTab(1)
        const uuid =
          typeof invite.spawnDetails === 'string'
            ? JSON.parse(invite.spawnDetails).spawnPoint
            : invite.spawnDetails.spawnPoint
        setSpawnPointUUID(
          typeof invite.spawnDetails === 'string'
            ? JSON.parse(invite.spawnDetails).spawnPoint
            : invite.spawnDetails.spawnPoint
        )
      }
      if (invite.timed) {
        setTimed(true)
        setStartTime(invite.startTime)
        setEndTime(invite.endTime)
      }
    }
  }, [invite])

  const handleChangeInviteTypeTab = (event: React.SyntheticEvent, newValue: number) => {
    setInviteTypeTab(newValue)
  }

  const locationMenu: InputMenuItem[] = adminLocations.map((el) => {
    return {
      value: `${el.id.value}`,
      label: `${el.name.value} (${el.sceneId.value})`
    }
  })

  const instanceMenu: InputMenuItem[] = adminInstances.map((el) => {
    return {
      value: `${el.id.value}`,
      label: `${el.id.value} (${el.location.name.value})`
    }
  })

  const userMenu: InputMenuItem[] = adminUsers.map((el) => {
    return {
      value: `${el.inviteCode.value}`,
      label: `${el.name.value} (${el.inviteCode.value})`
    }
  })

  const spawnPointMenu: InputMenuItem[] = spawnPoints.map(([id, value]) => {
    const transform = value.components.find((component) => component.name === 'transform')
    if (transform) {
      const position = transform.props.position
      return {
        value: `${id}`,
        label: `${id} (x: ${position.x}, y: ${position.y}, z: ${position.z})`
      }
    }
    return {
      value: `${id}`,
      label: `${id}`
    }
  })

  const handleChangeSpawnTypeTab = (event: React.SyntheticEvent, newValue: number) => {
    setSpawnTypeTab(newValue)
  }

  const handleLocationChange = (e) => {
    setLocationId(e.target.value)
    const location = adminLocations.find((location) => location.id.value === e.target.value)
    if (location && location.sceneId.value) {
      const sceneName = location.sceneId.value.split('/')
      AdminSceneService.fetchAdminScene(sceneName[0], sceneName[1])
    }
  }

  const handleInstanceChange = (e) => {
    setInstanceId(e.target.value)
    const instance = adminInstances.find((instance) => instance.id.value === e.target.value)
    if (instance) {
      const location = adminLocations.find((location) => location.id.value === instance.locationId.value)
      if (location) {
        const sceneName = location.sceneId.value.split('/')
        AdminSceneService.fetchAdminScene(sceneName[0], sceneName[1])
      }
    }
  }

  const handleUserChange = (e) => {
    setUserInviteCode(e.target.value)
  }

  const handleSpawnPointChange = (e) => {
    setSpawnPointUUID(e.target.value)
  }

  const submitInvite = async (event: React.SyntheticEvent) => {
    const target = textValue
    try {
      const inviteType = INVITE_TYPE_TAB_MAP[inviteTypeTab]
      const isPhone = phoneRegex.test(target)
      const isEmail = emailRegex.test(target)
      const sendData = {
        id: invite.id,
        inviteType: inviteType,
        inviteeId: invite.inviteeId,
        passcode: invite.passcode,
        token: target.length === 8 ? null : target,
        inviteCode: target.length === 8 ? target : null,
        identityProviderType: isEmail ? 'email' : isPhone ? 'sms' : null,
        targetObjectId: instanceId || locationId || null,
        createdAt: invite.createdAt || new Date().toJSON(),
        updatedAt: invite.updatedAt || new Date().toJSON(),
        makeAdmin: makeAdmin,
        deleteOnUse: oneTimeUse,
        invitee: undefined,
        user: undefined,
        userId: invite.userId
      } as InviteInterface
      if (setSpawn && spawnTypeTab === 0 && userInviteCode) {
        sendData.spawnType = 'inviteCode'
        sendData.spawnDetails = { inviteCode: userInviteCode }
      } else if (setSpawn && spawnTypeTab === 1 && spawnPointUUID) {
        sendData.spawnType = 'spawnPoint'
        sendData.spawnDetails = { spawnPoint: spawnPointUUID }
      }
      sendData.timed = timed && (startTime != null || endTime != null)
      if (sendData.timed) {
        sendData.startTime = startTime
        sendData.endTime = endTime
      }
      await AdminInviteService.updateInvite(invite.id, sendData)
      setInstanceId('')
      setLocationId('')
      setTextValue('')
      setMakeAdmin(false)
      setOneTimeUse(true)
      setUserInviteCode('')
      setSetSpawn(false)
      setSpawnPointUUID('')
      setSpawnTypeTab(0)
      setInviteTypeTab(0)
      setTimed(false)
      setStartTime(null)
      setEndTime(null)
    } catch (err) {
      NotificationService.dispatchNotify(err.message, { variant: 'error' })
    }
    setTimeout(() => AdminInviteService.fetchAdminInvites(), 500)
    onClose()
  }

  const disableSendButton = (): boolean => {
    return (
      textValue.length === 0 ||
      (inviteTypeTab === 1 && locationId.length === 0) ||
      (inviteTypeTab === 2 && instanceId.length === 0)
    )
  }

  return (
    <DrawerView open={open} onClose={onClose}>
      <Container maxWidth="sm" className={styles.mt20}>
        <DialogTitle className={styles.textAlign}>{t('admin:components.invite.create')}</DialogTitle>
        <FormGroup>
          <Tabs
            value={inviteTypeTab}
            className={styles.marginBottom10px}
            onChange={handleChangeInviteTypeTab}
            aria-label="Invite Type"
            classes={{ root: styles.tabRoot, indicator: styles.selected }}
          >
            <Tab
              className={inviteTypeTab === 0 ? styles.selectedTab : styles.unselectedTab}
              label={INVITE_TYPE_TAB_MAP[0].replace('-', ' ')}
              classes={{ root: styles.tabRoot }}
            />
            <Tab
              className={inviteTypeTab === 1 ? styles.selectedTab : styles.unselectedTab}
              label={INVITE_TYPE_TAB_MAP[1].replace('-', ' ')}
            />
            <Tab
              className={inviteTypeTab === 2 ? styles.selectedTab : styles.unselectedTab}
              label={INVITE_TYPE_TAB_MAP[2].replace('-', ' ')}
            />
          </Tabs>
          <div className={styles.inputContainer}>
            <InputText
              name="urlSelect"
              label={t('admin:components.invite.singleTargetLabel')}
              placeholder={t('admin:components.invite.singleTarget')}
              value={textValue}
              disabled={true}
            />
          </div>
          <FormControlLabel
            control={
              <Checkbox
                checked={oneTimeUse}
                onChange={() => {
                  setOneTimeUse(!oneTimeUse)
                }}
              />
            }
            label="One-time use"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={timed}
                onChange={() => {
                  setTimed(!timed)
                }}
              />
            }
            label="Timed invite"
          />
          {timed && (
            <div className={styles.datePickerContainer}>
              <LocalizationProvider dateAdapter={AdapterMoment}>
                <div className={styles.pickerControls}>
                  <DateTimePicker
                    label="Start Time"
                    value={startTime}
                    onChange={(e) => setStartTime(e)}
                    renderInput={(params) => <TextField className={styles.dateTimePickerDialog} {...params} />}
                  />
                  <IconButton
                    color="primary"
                    size="small"
                    className={styles.clearTime}
                    onClick={() => setStartTime(null)}
                    icon={<Icon type="HighlightOff" />}
                  />
                </div>
                <div className={styles.pickerControls}>
                  <DateTimePicker
                    label="End Time"
                    value={endTime}
                    onChange={(e) => setEndTime(e)}
                    renderInput={(params) => <TextField className={styles.dateTimePickerDialog} {...params} />}
                  />
                  <IconButton
                    color="primary"
                    size="small"
                    className={styles.clearTime}
                    onClick={() => setEndTime(null)}
                    icon={<Icon type="HighlightOff" />}
                  />
                </div>
              </LocalizationProvider>
            </div>
          )}
          {inviteTypeTab === 0 && (
            <FormControlLabel
              control={
                <Checkbox
                  checked={makeAdmin}
                  onChange={() => {
                    setMakeAdmin(!makeAdmin)
                  }}
                />
              }
              label="Make user admin"
            />
          )}
          {(inviteTypeTab === 1 || inviteTypeTab === 2) && (
            <div className={styles.marginBottom10px}>
              {inviteTypeTab === 1 && (
                <InputSelect
                  name="location"
                  className={classNames({
                    [styles.maxWidth90]: true,
                    [styles.inputField]: true
                  })}
                  label={t('admin:components.invite.location')}
                  value={locationId}
                  menu={locationMenu}
                  disabled={false}
                  onChange={handleLocationChange}
                />
              )}
              {inviteTypeTab === 2 && (
                <InputSelect
                  name="instance"
                  className={classNames({
                    [styles.maxWidth90]: true,
                    [styles.inputField]: true
                  })}
                  label={t('admin:components.invite.instance')}
                  value={instanceId}
                  menu={instanceMenu}
                  disabled={false}
                  onChange={handleInstanceChange}
                />
              )}
              {((inviteTypeTab === 1 && locationId) || (inviteTypeTab === 2 && instanceId)) && (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={setSpawn}
                      onChange={() => {
                        setSetSpawn(!setSpawn)
                      }}
                    />
                  }
                  label="Spawn at position"
                />
              )}
              {setSpawn && (
                <Tabs
                  value={spawnTypeTab}
                  className={styles.marginBottom10px}
                  onChange={handleChangeSpawnTypeTab}
                  aria-label="Spawn position"
                  classes={{ root: styles.tabRoot, indicator: styles.selected }}
                >
                  <Tab
                    className={spawnTypeTab === 0 ? styles.selectedTab : styles.unselectedTab}
                    label="User position"
                    classes={{ root: styles.tabRoot }}
                  />
                  <Tab
                    className={spawnTypeTab === 1 ? styles.selectedTab : styles.unselectedTab}
                    label={'Spawn Point'}
                  />
                </Tabs>
              )}
              {setSpawn && spawnTypeTab === 0 && (
                <InputSelect
                  name="user"
                  className={classNames({
                    [styles.maxWidth90]: true,
                    [styles.inputField]: true
                  })}
                  label={t('admin:components.invite.user')}
                  value={userInviteCode}
                  menu={userMenu}
                  disabled={false}
                  onChange={handleUserChange}
                />
              )}
              {setSpawn && spawnTypeTab === 1 && (
                <InputSelect
                  name="spawnPoint"
                  className={classNames({
                    [styles.maxWidth90]: true,
                    [styles.inputField]: true
                  })}
                  label={t('admin:components.invite.spawnPoint')}
                  value={spawnPointUUID}
                  menu={spawnPointMenu}
                  disabled={false}
                  onChange={handleSpawnPointChange}
                />
              )}
            </div>
          )}
          <Button
            className={styles.submitButton}
            type="button"
            variant="contained"
            color="primary"
            disabled={disableSendButton()}
            onClick={submitInvite}
          >
            {t('admin:components.invite.update')}
          </Button>
        </FormGroup>
      </Container>
    </DrawerView>
  )
}

export default UpdateInviteModal
