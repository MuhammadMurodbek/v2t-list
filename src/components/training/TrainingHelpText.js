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
          Om talaren säger ”ny rad”, tryck ”⮐” (Editorn korrigerar)
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
    </EuiText>
  </Fragment>
)

export default TrainingHelpText
