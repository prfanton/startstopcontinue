import type { RetroFormat } from '@/types/retro'

export const FORMATS: Record<string, RetroFormat> = {
  wwwdw: {
    id: 'wwwdw',
    label: 'What Went Well / Didn\'t Go Well',
    columns: [
      { id: 'went_well',      label: 'What Went Well',       color: 'green',  placeholder: 'Something that worked great...' },
      { id: 'didnt_go_well',  label: "What Didn't Go Well",  color: 'red',    placeholder: 'Something that could be improved...' },
      { id: 'action_items',   label: 'Action Items',          color: 'blue',   placeholder: 'Something we should do next...' },
    ],
  },
  ssc: {
    id: 'ssc',
    label: 'Start / Stop / Continue',
    columns: [
      { id: 'start',    label: 'Start',    color: 'green',  placeholder: 'Something we should start doing...' },
      { id: 'stop',     label: 'Stop',     color: 'red',    placeholder: 'Something we should stop doing...' },
      { id: 'continue', label: 'Continue', color: 'blue',   placeholder: 'Something we should keep doing...' },
    ],
  },
  msg: {
    id: 'msg',
    label: 'Mad / Sad / Glad',
    columns: [
      { id: 'mad',  label: 'Mad',  color: 'red',    placeholder: 'Something that frustrated you...' },
      { id: 'sad',  label: 'Sad',  color: 'yellow', placeholder: 'Something that disappointed you...' },
      { id: 'glad', label: 'Glad', color: 'green',  placeholder: 'Something that made you happy...' },
    ],
  },
}

export function getFormat(id: string): RetroFormat {
  return FORMATS[id] ?? FORMATS.wwwdw
}
