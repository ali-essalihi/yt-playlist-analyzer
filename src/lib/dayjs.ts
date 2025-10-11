import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'

dayjs.extend(relativeTime)
dayjs.extend(customParseFormat)
dayjs.extend(isSameOrAfter)

export default dayjs
