// Used react synthetic event
import React, { Fragment } from 'react'
import { EuiSpacer, EuiText } from '@elastic/eui'
import '../../App.css'
import { EuiI18n } from '@elastic/eui'

const TrainingHelpText = () => (
  <Fragment>
    <EuiText style={{ letterSpacing: '.009em' }}>
      <EuiSpacer size="s" />
      <h1 style={{ letterSpacing: '.03em' }}>
        <EuiI18n
          token="howDoICorrectTheText"
          default="How do I correct the text?"
        />
      </h1>
      <EuiSpacer size="l" />
      <EuiI18n
        token="changeTheTextToMatchTheAudio"
        default="Change the text to match the audio clip verbatim even if the grammar is incorrect."
      />
      <EuiSpacer size="m" />
      <EuiI18n
        token="ifTheWordsAreCutOff"
        default="If the words are ”cut off”, (the first or last syllable is missing or not complete) is used"
      />
      <br />
      <EuiSpacer size="s" />
      <EuiI18n
        token="rejectToIndicateThatTheAudioClipIsNotSuitable"
        default="Reject to indicate that the audio clip is not suitable as training data."
      />
      <EuiSpacer size="m" />
      <EuiI18n
        token="scopedLanguagesAlsoContainsRestartedSentences"
        default="Spoken language also contains restarted sentences (you said wrong, skipped a word, etc.),"
      />
      <br />
      <EuiSpacer size="s" />
      <EuiI18n
        token="repetitionsAndTheLikeThat"
        default="repetitions and the like that are typically missing in the text."
      />
      <EuiSpacer size="m" />
      <EuiI18n
        token="itIsOkToAlsoIntroduce"
        default="It is okay to also introduce “eh“ and type stuttering but no requirement."
      />
      <EuiSpacer size="m" />
      <EuiI18n
        token="ifYouAreUnsureUseAShip"
        default="If you are unsure, use a ship!"
      />
      <EuiSpacer size="m" />
      <h2 style={{ letterSpacing: '.009em' }}>
        <EuiI18n token="handlingOfFigures" default="Handling of figures" />
      </h2>
      <ul>
        <li>
          <EuiI18n
            token="numbersOftenNeedToBeCorrect"
            default="Numbers often need to be corrected."
          />
        </li>
        <EuiSpacer size="m" />
        <li>
          <EuiI18n
            token="writeEverythingInLetters"
            default="Write everything in letters (preferably lowercase (lower case))."
          />
        </li>
        <EuiSpacer size="m" />
        <li>
          <EuiI18n
            token="ifTheSpeakerSaysNumber"
            default="If the speaker says “113”, the words used in the audio clip should be replaced; “One hundred and thirteen“"
          />
          <br />
          <EuiSpacer size="s" />
          <EuiI18n
            token="numbersExampleContinue"
            default="”One hundred thirteen”, ”eleven three”, ”one thirteen” or ”one one three”"
          />
        </li>
      </ul>
      <EuiSpacer size="m" />
      <h2 style={{ letterSpacing: '.009em' }}>
        {' '}
        <EuiI18n token="specialCharacters" default="Special characters" />{' '}
      </h2>
      <ul>
        <li>
          <EuiI18n
            token="ifTheSpeakerSaysPoint"
            default="If the speaker says ”point”, write ”.” (The editor corrects)"
          />
        </li>
        <EuiSpacer size="m" />
        <li>
          <EuiI18n
            token="ifTheSpeakerSaysPercent"
            default="If the speaker says ”percent”, type ”%” (Editor corrects)"
          />
        </li>
        <EuiSpacer size="m" />
        <li>
          <EuiI18n
            token="ifTheSpeakerSaysComa"
            default="If the speaker says ”come”, write ”,” (Editor corrects)"
          />
        </li>
        <EuiSpacer size="m" />
        <li>
          <EuiI18n
            token="newLineAndDot"
            default="“New line“ and “dot“ can both be missing in text or added despite"
          />
          <br />
          <EuiSpacer size="s" />
          <EuiI18n
            token="missingFromAudioClip"
            default="that they are missing from the audio clip. Correct!"
          />
        </li>
        <EuiSpacer size="m" />
        <li>
          <EuiI18n
            token="writeAbbreviationsAsTheySay"
            default="Write abbreviations as they say in the audio clip, “u.a.“ can thus be both “u a“ and “without comment“,"
          />
          <br />
          <EuiSpacer size="s" />
          <EuiI18n
            token="atCanBeGeneralState"
            default="“AT“ can become “a t“ or “general state“"
          />
        </li>
      </ul>
      <h2 style={{ letterSpacing: '.009em' }}>
        {' '}
        <EuiI18n
          token="doNotUseAbbreviations"
          default="Do not use abbreviations if the speech contains unabridged forms"
        />{' '}
      </h2>
      <ul>
        <li>
          <EuiI18n
            token="sSKWriteNurse"
            default="ssk - write nurse (or nurse) but say doctor s s k, write s s k"
          />
        </li>
        <EuiSpacer size="m" />
        <li>
          <EuiI18n token="dskWrite" default="dsk - write the district nurse" />
        </li>
        <EuiSpacer size="m" />
        <li>
          <EuiI18n token="drDoctor" default="dr - write doctor" />
        </li>
        <EuiSpacer size="m" />
        <li>
          <EuiI18n token="mgMilligrams" default="mg - write milligrams" />
        </li>
        <EuiSpacer size="m" />
        <li>
          <EuiI18n
            token="tempWrite"
            default="temp - write temp if that's what was said, but if you say temperature, write the whole word!"
          />
        </li>
        <EuiSpacer size="m" />
      </ul>
      <h2 style={{ letterSpacing: '.009em' }}>
        <EuiI18n
          token="writeInsulatedLetters"
          default="Write insulated letters if abbreviations are lettered"
        />
      </h2>
      <ul>
        <li>
          <EuiI18n token="mrWrite" default="MR - write m r" />
        </li>
        <EuiSpacer size="m" />
        <li>
          <EuiI18n token="atWrite" default="to - write a t" />
        </li>
        <EuiSpacer size="m" />
      </ul>
      <h2 style={{ letterSpacing: '.009em' }}>
        <EuiI18n
          token="useOnlyAlphabeticCharacters"
          default="Use only alphabetic characters"
        />
      </h2>
      <ul>
        <li>
          <EuiI18n
            token="slashWrite"
            default="/ - Write what is said in the audio clip: slash, slash, and tell the doctor “assessment action“, do not write “assessment / action“."
          />
        </li>
        <EuiSpacer size="m" />
        <li>
          <EuiI18n
            token="xTimesWrite"
            default="x - just write x if it is said, times you write 'times' and not 'x' or 'times'"
          />
        </li>
        <EuiSpacer size="m" />
        <li>
          <EuiI18n
            token="patientNameOrFullSocialSecurityNumber"
            default="Patient name or full social security number:"
          />
        </li>
        <EuiSpacer size="m" />
        <li>
          <EuiI18n
            token="rejectAudioButton"
            default="Reject the audio clip down the reject button. No personal data in training data! Also use reject on audio clips that start or end with cut words"
          />
        </li>
        <EuiSpacer size="m" />
        <li>
          <EuiI18n
            token="namesOfDoctorsNursesHospitals"
            default="Names of doctors, nurses, hospitals ...: Write the names! Do not enter extra punctuation. Only write point if doctor says point, only write colon if doctor says colon etc."
          />
        </li>
        <EuiSpacer size="m" />
      </ul>
    </EuiText>
  </Fragment>
)

export default TrainingHelpText
