import { RangeSlider } from '@blueprintjs/core'
import type { SaxsData } from '../types/saxs'

/**
 * How much of the slider's own labelling to draw.
 *
 *   all     - axis labels plus a label on each handle (the default)
 *   handles - handles only; used where a readout beside the slider already
 *             spells out the range and a second row of numbers just collides
 *   none    - neither; on a phone the two handle labels overlap each other
 *             as soon as the range is narrow
 */
type LabelMode = 'all' | 'handles' | 'none'

interface Props {
	data: SaxsData
	iMin: number
	iMax: number
	onChange: (next: { iMin: number; iMax: number }) => void
	onRelease?: (next: { iMin: number; iMax: number }) => void
	labels?: LabelMode
}

export function RangeControls({
	data,
	iMin,
	iMax,
	onChange,
	onRelease,
	labels = 'all',
}: Props) {
	const last = data.q.length - 1
	const step = Math.max(1, Math.floor(last / 6))

	const labelProps =
		labels === 'none'
			? ({ labelRenderer: false } as const)
			: labels === 'handles'
				? ({
						labelValues: [] as number[],
						labelRenderer: (i: number) => data.q[i]?.toFixed(3) ?? String(i),
					} as const)
				: ({
						labelStepSize: step,
						labelRenderer: (i: number) => data.q[i]?.toFixed(3) ?? String(i),
					} as const)

	return (
		<RangeSlider
			min={0}
			max={last}
			stepSize={1}
			{...labelProps}
			value={[iMin, iMax]}
			onChange={([a, b]) => onChange({ iMin: a, iMax: b })}
			onRelease={
				onRelease ? ([a, b]) => onRelease({ iMin: a, iMax: b }) : undefined
			}
		/>
	)
}
