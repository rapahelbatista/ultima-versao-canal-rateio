import React from "react";
import Typography from "@material-ui/core/Typography";
import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles((theme) => ({
	title: {
		fontWeight: 700,
		fontSize: "1.125rem",
		color: "#1e293b",
		lineHeight: 1.2,
		margin: 0,
		[theme.breakpoints.down("xs")]: {
			fontSize: "1rem",
		},
	},
}));

export default function Title(props) {
	const classes = useStyles();
	return (
		<Typography variant="h2" className={classes.title}>
			{props.children}
		</Typography>
	);
}
