{{/* vim: set filetype=mustache: */}}


{{/*
Gets the resource name prefix to be used.
*/}}
{{- define "v2t-list.namePrefix" -}}
{{- .Values.global.namePrefix | default "" -}}
{{- end -}}

{{/*
Gets the service name
*/}}
{{- define "v2t-list.serviceName" -}}
{{- .Values.fullname | default .Chart.Name -}}
{{- end -}}

{{/*
Gets the full name for resources, including the prefix if any
*/}}
{{- define "v2t-list.name" -}}
{{- $namePrefix := include "v2t-list.namePrefix" . -}}
{{- $serviceName := include "v2t-list.serviceName" . -}}
{{- without (list $namePrefix $serviceName) "" | join "-" -}}
{{- end -}}
