import React, {Fragment, useEffect, useState} from 'react'
import Page from '../components/Page'
import {
    EuiSpacer,
    EuiButton,
    EuiI18n,
    EuiSteps
} from '@elastic/eui'
import api from '../api'
import Departments from '../components/Departments'
import Schemas from '../components/Schemas'
import jwtDecode from 'jwt-decode'
import {
    addErrorToast
} from '../components/GlobalToastList'
import getQueryStringValue from '../models/getQueryStringValue'
import { isConstructorDeclaration } from 'typescript'

const Live = (props) => {
    const [departments, setDepartments] = useState([])
    const [schemas, setSchemas] = useState([])
    const [schema, setSchema] = useState('')
    const [departmentId, setDepartmentId] = useState('')
    const [schemaId, setSchemaId] = useState(null)
    const [sessionId, setSessionId] = useState(null)
    const [activeSessionStatus, setActiveSessionStatus] = useState('loading')
    const [schemaSelectionStatus, setSchemaSelectionStatus] = useState('disabled')

    useEffect(() => {
        const checkExistingSession = async () => {
            try {
                const {data: {id: sessId}} = await api.getActiveLiveSession()
                setSessionId(sessId)
                if (sessId) {
                    await closeCurrentSession(sessId)
                }
            } catch (e) {
                const {status} = e.request
                if (status === 404) {
                    setActiveSessionStatus('complete')
                }
            }
        }

        const getDepartments = async () => {
            try {
                const {data: {departments}} = await api.getDepartments()
                setDepartments(departments)
                setDepartmentId(departments[0].id)
                await iterateSchemaList(departments[0].id)
            } catch (e) {
                console.error('hola', e)
            }
        }
        checkExistingSession()
        getDepartments()
    }, [])

    const iterateSchemaList = async (departmentId) => {
        const {
            data: {schemas: schemaList}
        } = await api.getSchemas({departmentId})
        setSchemas(schemaList?.length > 0 ? schemaList : [])
        setSchema(schemaList?.length > 0 ? schemaList[0] : '')
        setSchemaId(schemaList?.length > 0 ? schemaList[0].id : '')
    }

    const closeCurrentSession = async (sesId) => {
        try {
            await api.completeLiveTranscript(sesId)
            setActiveSessionStatus('complete')
            setSessionId(null)
        } catch (error) {
            console.error(error)
        }
    }

    const updateDepartmentId = async (dId) => {
        setDepartmentId(dId)
        iterateSchemaList(dId)
    }

    const updateSchemaId = (sId) => {
        setSchemaId(sId)
    }

    const getTokenData = () => {
        const tokenFromStorage = localStorage.getItem('token')
        const tokenFromQuery = getQueryStringValue.prototype.decodeToken('token')
        let token
        let tokenStub = ''
        if (tokenFromStorage) {
            token = tokenFromStorage
        }

        if (tokenFromQuery) {
            token = tokenFromQuery
            tokenStub = `?token=${token}`
        }
        return {
            token,
            tokenStub
        }
    }

    const loadTranscriptId = async () => {
        const { token, tokenStub} = getTokenData()
        try {
            const userId = jwtDecode(token).sub
            const receivedTranscriptId = await api
                .createLiveSession(userId, schemaId)
            window.location = `/#live-diktering/${receivedTranscriptId}${tokenStub}`
        } catch (error) {
            if (error instanceof Error) {
                addErrorToast(error.message)
            }
            console.error(error)
        }
    }

    const getSchemaSelectionStatus = () => {
        if (activeSessionStatus === 'complete'
            && schemaSelectionStatus === 'disabled') {
            return 'loading'
        } else if (activeSessionStatus === 'complete'
            && schemaSelectionStatus === 'complete') {
            return 'complete'
        } else {
            return 'disabled'
        }

    }
    const firstSetOfSteps = [
        {
            title: <EuiI18n
                token="checkExistingActiveLiveSession"
                default="Check existing active live session"
            />,
            children:
                (sessionId ? (
                    <Fragment>
                        <p>
                            <EuiI18n
                                token="activeSessionFound"
                                default="Active session found"
                            />
                        </p>
                        <EuiButton
                            size="s"
                            fill
                            onClick={() => closeCurrentSession(sessionId)}
                        >
                            <EuiI18n
                                token="closeActiveSession"
                                default="Close Current Session"
                            />
                        </EuiButton>
                    </Fragment>
                ) : (<EuiI18n
                    token="noActiveSessionFound"
                    default="No active session found! Good to go!!"
                />))
            ,
            status: activeSessionStatus
        },
        {
            title: <EuiI18n
                token="selectDepartmentAndSchema"
                default="Select Department and Schema"
            />,
            children: (
                <Fragment>
                    {activeSessionStatus === ('complete') && (
                        <>
                            <Departments
                                departments={departments || []}
                                departmentId={departmentId}
                                onUpdate={updateDepartmentId}
                            />
                            <EuiSpacer size="s"/>
                            <Schemas
                                // eslint-disable-next-line react/prop-types
                                location={props.location}
                                schemas={schemas || []}
                                schemaId={schema.id}
                                onUpdate={updateSchemaId}
                            />
                            <EuiSpacer size="s"/>
                            {schema !== ''
                            && schemaSelectionStatus !== ('complete')
                            && <EuiButton
                                size="s"
                                fill
                                onClick={async () => {
                                    setSchemaSelectionStatus('complete')
                                    await loadTranscriptId()
                                }}
                            >
                                <EuiI18n
                                    token="confirmSchemaSelection"
                                    default="Confirm Schema Selection"
                                />
                            </EuiButton>}
                        </>
                    )}
                </Fragment>
            ),
            status: getSchemaSelectionStatus()
        },
        {
            title: <EuiI18n
                token="startLiveDictation"
                default="Initiate a live transcript session"
            />,
            children: (
                <Fragment>
                    {
                        getSchemaSelectionStatus() === 'complete' ? (
                            <p>Redirecting ... </p>
                        ) : (<></>)
                    }
                </Fragment>),
            status: getSchemaSelectionStatus() === 'complete' ? 'loading' : 'disabled'
        }
    ]
    return (
        <EuiI18n
            token="live"
            default="Live Dictation"
        >
            {(pageTitle) => (
                <Page preferences title={pageTitle}>
                    <EuiSteps steps={firstSetOfSteps}/>
                </Page>
            )}
        </EuiI18n>
    )
}

export default Live