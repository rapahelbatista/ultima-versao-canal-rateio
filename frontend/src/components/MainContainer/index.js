import React from "react";

import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles((theme) => ({
	mainContainer: {
		flex: 1,
		display: "flex",
		flexDirection: "column",
		gap: theme.spacing(3),
		padding: theme.spacing(3),
		background: "#f8fafc",
		minHeight: "100%",
		boxSizing: "border-box",
		[theme.breakpoints.down("sm")]: {
			gap: theme.spacing(2),
			padding: theme.spacing(2),
		},
	},

	contentWrapper: {
		flex: 1,
		display: "flex",
		flexDirection: "column",
		gap: theme.spacing(2),
		background: "#fff",
		border: "1px solid #e2e8f0",
		borderRadius: theme.shape.borderRadius * 2,
		padding: theme.spacing(2.5),
		boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
		minHeight: 0,
		[theme.breakpoints.down("xs")]: {
			padding: theme.spacing(2),
		},
	},
}));

const MainContainer = ({ children }) => {
	const classes = useStyles();

	return (
		<div className={classes.mainContainer}>
			<div className={classes.contentWrapper}>{children}</div>
		</div>
	);
};

export default MainContainer;
