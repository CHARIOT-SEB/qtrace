import { RangeSlider } from '@blueprintjs/core'
import type { SaxsData } from '../types/saxs'

interface Props {
	data: SaxsData
	iMin: number
	iMax: number
	onChange: (next: { iMin: number; iMax: number }) => void
	onRelease?: (next: { iMin: number; iMax: number }) => void
	/**
	 * Drop the axis labels. Used in the fit-range bar, where the q values are
	 * already spelled out in the readout beside the slider and a second row of
	 * numbers underneath just collides with them.
	 */
	compact?: boolean
}

export function RangeControls({
	data,
	iMin,
	iMax,
	onChange,
	onRelease,
	compact,
}: Props) {
	const last = data.q.length - 1
	const step = Math.max(1, Math.floor(last / 6))

	return (
		<RangeSlider
			min={0}
			max={last}
			stepSize={1}
			{...(compact
				? { labelValues: [] }
				: { labelStepSize: step })}
			labelRenderer={(i) => data.q[i]?.toFixed(3) ?? String(i)}
			value={[iMin, iMax]}
			onChange={([a, b]) => onChange({ iMin: a, iMax: b })}
			onRelease={
				onRelease ? ([a, b]) => onRelease({ iMin: a, iMax: b }) : undefined
			}
		/>
	)
}
