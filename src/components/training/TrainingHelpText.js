// Used react synthetic event
import React, { Fragment } from 'react'
import { EuiSpacer, EuiText } from '@elastic/eui'
import '../../App.css'

const TrainingHelpText = () => (
  <Fragment>
    <EuiText style={{ letterSpacing: '.009em' }}>
      <EuiSpacer size="s" />
      <h1 style={{ letterSpacing: '.03em' }}>Hur rättar jag texten?</h1>
      <EuiSpacer size="l" />
      Ändra så att texten stämmer ordagrant med ljudklippet, även om grammatiken blir fel.
      <EuiSpacer size="m" />
      Om orden är ”avhuggna”, (första eller sista stavelsen saknas eller är inte komplett) använd
      <br />
      <EuiSpacer size="s" />
      Reject för att markera att ljudklippet inte är lämpligt som träningsdata.
      <EuiSpacer size="m" />
      Talat språk innehåller också omstartade meningar (man sa fel, hoppade över ett ord, osv),
      <br />
      <EuiSpacer size="s" />
      upprepningar och liknande som typiskt saknas i texten.
      <EuiSpacer size="m" />
      Det är okej att också införa “eh” och typ stamningar men inget krav.
      <EuiSpacer size="m" />
      Är du osäker, använd skip!
      <EuiSpacer size="m" />
      <h2 style={{ letterSpacing: '.009em' }}> Hantering av siffror </h2>
      <ul>
        <li>
          Siffror behöver ofta korrigeras.
        </li>
        <EuiSpacer size="m" />
        <li>
          Skriv allting med bokstäver (helst små (gemener)).
        </li>
        <EuiSpacer size="m" />
        <li>
          Om talaren säger “113” skall bytas ut mot de ord som använts i
          ljudklippet; “etthundratretton”,
          <br />
          <EuiSpacer size="s" />
          “hundratretton”, “elva tre”, “ett tretton” eller “ett ett tre”
        </li>
      </ul>
      <EuiSpacer size="m" />
      <h2 style={{ letterSpacing: '.009em' }}> Specialtecken </h2>
      <ul>
        <li>
          Om talaren säger ”punkt”, skriv ”.” (Editorn korrigerar)
        </li>
        <EuiSpacer size="m" />
        <li>
          Om talaren säger ”procent”, skriv ”%” (Editorn korrigerar)
        </li>
        <EuiSpacer size="m" />
        <li>
          Om talaren säger ”komma”, skriv ”,” (Editorn korrigerar)
        </li>
        <EuiSpacer size="m" />
        <li>
        “Ny rad” och “punkt” kan både saknas i text eller ha lagts till trots
          <br />
          <EuiSpacer size="s" />
          att de saknas i ljudklippet. Korrigera!
        </li>
        <EuiSpacer size="m" />
        <li>
          Skriv förkortningar som de sägs i ljudklippet, “u.a.”
          kan alltså bli både “u a” och “utan anmärkning”,
          <br />
          <EuiSpacer size="s" />
          “AT” kan bli “a t” eller “allmäntillstånd”
        </li>
      </ul>
      <h2 style={{ letterSpacing: '.009em' }}> Använd ej förkortningar om talet innehåller icke oförkortad fom </h2>
      <ul>
        <li>ssk - skriv sjuksköterska (eller sjuksköterskan) men säger läkaren s s k, skriv s s k
        </li>
        <EuiSpacer size="m" />
        <li>dsk - skriv distriktsköterskan</li>
        <EuiSpacer size="m" />
        <li>dr - skriv doktor</li>
        <EuiSpacer size="m" />
        <li>mg - skriv milligram</li>
        <EuiSpacer size="m" />
        <li>temp - skriv temp om det var det som sas, men sa man temperatur, skriv hela ordet!</li>
        <EuiSpacer size="m" />
      </ul>
      
      <h2 style={{ letterSpacing: '.009em' }}>Skriv isolerade bokstäver om förkortningar bokstaveras</h2>
      <ul>
        <li>MR - skriv m r</li>
        <EuiSpacer size="m" />
        <li>at - skriv a t</li>
        <EuiSpacer size="m" />
      </ul>
      
      <h2 style={{ letterSpacing: '.009em' }}>Använd bara alfabetiska tecken</h2>
      <ul>
        <li>/ - skriv det som sägs i ljudklippet: snedstreck, slash, och säger läkaren “bedömning åtgärd”, skriv
inte "bedömning/åtgärd”.</li>
        <EuiSpacer size="m" />
        <li>x - skriv bara x om det sägs, sa man gånger så skriv ‘gånger’ och inte ‘x’ eller ‘ggr’</li>
        <EuiSpacer size="m" />
        <li>Patient namn eller fullständigt personnummer:</li>
        <EuiSpacer size="m" />
        <li>Rejecta ljudklippet ned reject-knappen. Inga personuppgifter i träningsdatat! Använd också reject på ljudklipp som inleds eller avslutas med avhuggna ord</li>
        <EuiSpacer size="m" />
        <li>Namn på läkare, sköterskor, sjukhus…: Skriv namnen!
Lägg inte in extra skiljetecken. Skriv bara punkt om läkaren säger punkt, skriv bara kolon om läkaren säger kolon osv.</li>
        <EuiSpacer size="m" />
      </ul>
    </EuiText>
  </Fragment>
)

export default TrainingHelpText
