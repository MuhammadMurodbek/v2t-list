// Used react synthetic event
import React, { Fragment } from 'react'
import { EuiBasicTable, EuiSpacer, EuiListGroup, EuiListGroupItem } from '@elastic/eui'
import '../../App.css'

const TrainingHelpText = () => {
  return (
    <Fragment>
      <EuiSpacer size="s" />
      <h3>Hur rättar jag texten?</h3>
      <EuiSpacer size="l" />
      <li>
        <ul>
          <p>
            Typiska fel är att det är extra ord i början eller slutet,
            eller att det saknas ord i början och slutet.
          </p>
        </ul>
      </li>
      <li>
        <ul>
          <p>
            Om orden dessutom är avhuggna,(första eller sista stavelsen
            saknas eller är inte komplett) använd <br />
            skip för att markera att ljudklippet inte är lämpligt som träningsdata.
          </p>
        </ul>
      </li>
      <li>
        <ul>
          <p>
            Skriv allting med bokstäver (helst små (gemener)). Det betyder att “113” skall
            bytas ut mot de ord  <br /> som använts i ljudklippet; “etthundratretton”,
            “hundratretton”, “elva tre”, “ett tretton” eller “ett ett tre”. <br /> Samma sak för
            specialtecken; “.” blir “punkt”, “%” blir “procent”
          </p>
        </ul>
      </li>
      <li>
        <ul>
          <p>
            Skriv förkortningar som de sägs i ljudklippet, “u.a.” kan alltså bli både
            “u a” och “utan anmärkning”, <br /> “AT” kan bli “a t” eller “allmäntillstånd”.
          </p>
        </ul>
      </li>
      <li>
        <ul>
          <p>
            “ny rad” och “punkt” kan både saknas i 
            text eller ha lagts till trots att de saknas i ljudklippet. Korrigera!
          </p>
        </ul>
      </li>
      <li>
        <ul>
          <p>
            Siffror behöver ofta korrigeras
          </p>
        </ul>
      </li>
      <li>
        <ul>
          <p>
           Det är inte heller ovanligt att texten modifierats för att bli mer grammatiskt korrekt.
                      Ändra så att texten  <br /> stämmer med ljudklippet, även om grammatiken blir fel
          </p>
        </ul>
      </li>
      <li>
        <ul>
          <p>
            Talat språk innehåller också omstartade meningar (man sa fel, hoppade över ett ord, 
                      osv), upprepningar  <br /> och liknande som typiskt saknas i texten.
                      Ändra så att texten stämmer ordagrant.
          </p>
        </ul>
      </li>
      <li>
        <ul>
          <p>Det är okej att också införa “eh” och typ stamningar men inget krav</p>
        </ul>
      </li>
      <li>
        <ul>
          <p>Är du osäker, använd skip!</p>
        </ul>
      </li>   
    </Fragment>
    )
}

export default TrainingHelpText
