export const SWITCH_PROFILE_IDS = {
	overlayMotion: "switch-profile-overlay-motion",
	handleButton: "switch-profile-handle-button",
	closeButton: "switch-profile-close-button",
} as const;
// The SWITCH_PROFILE_IDS constant defines unique identifiers for various elements of the profile switching component, such as the overlay motion, handle button, and close button. These IDs can be used for targeting specific elements in the DOM for styling, animations, or testing purposes, ensuring that the component's interactive elements are easily identifiable and manageable within the codebase.
export const SWITCH_PROFILE_CLOSE_DURATION_MS = 220;

export const SWITCH_PROFILE_MOTION = {
	from: {
		opacity: 0,
		scale: 0.98,
		translateY: 16,
	},
	enter: {
		opacity: 1,
		scale: 1,
		translateY: 0,
	},
	exit: {
		opacity: 0,
		scale: 0.84,
		translateY: 48,
	},
	transition: {
		type: "timing" as const,
		duration: SWITCH_PROFILE_CLOSE_DURATION_MS,
	},
};
