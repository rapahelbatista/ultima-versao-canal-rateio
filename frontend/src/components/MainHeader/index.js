import React from "react";

import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles((theme) => ({
	contactsHeader: {
		display: "flex",
		alignItems: "center",
		justifyContent: "space-between",
		flexWrap: "wrap",
		gap: theme.spacing(1.5),
		paddingBottom: theme.spacing(1.5),
		marginBottom: theme.spacing(1.5),
		borderBottom: "1px solid #f1f5f9",
		[theme.breakpoints.down("xs")]: {
			alignItems: "stretch",
		},
	},
}));

const MainHeader = ({ children }) => {
	const classes = useStyles();

	return <div className={classes.contactsHeader}>{children}</div>;
};

export default MainHeader;
