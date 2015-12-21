var AccountInfo = React.createClass({

	getInitialState: function() {
		return ({showAlert: false});
	},

	closeAlert: function() {
		this.setState({showAlert: false});
	},

	comingSoon: function() {
		this.setState({showAlert: true});
	},

	render: function() {

		return (
			<section className="white minH bluetop">
				<div className="container">
					<h1>Hi {this.props.user[0].firstname},</h1>
					<h1 className="account_welcome">Welcome to your account</h1>

					<br />
					<h5>Your information</h5>
					<div className="account_info">
						<p className="mb10"><span className="account_section">username:</span> {this.props.user[0].username} <i className="material-icons edit" onClick={this.comingSoon}>edit</i></p>
						<p className="mb10"><span className="account_section">name:</span> {this.props.user[0].firstname} {this.props.user[0].surname} <i className="material-icons edit" onClick={this.comingSoon}>edit</i></p>
						<p className="mb10"><span className="account_section">email:</span> {this.props.user[0].email} <span className="comingsoon"><i className="material-icons edit" onClick={this.comingSoon}>edit</i></span></p>
					</div>

					<br />
					<br />
					<h5>Your videos</h5>
					<div className="account_vids">

					</div>
				</div>
				{this.state.showAlert ? <Alert close={this.closeAlert}/> : null}
			</section>
		);
	}
});

var Alert = React.createClass({
	close: function() {
		this.props.close();
	},

	render: function() {
		return (
			<div className="alert">
				<div className="alert_inner">
					<p>This feature is coming soon!</p>
					<div onClick={this.close} className="button alert_button">Gotcha</div>
				</div>	
			</div>);
	}
});

var dave = [
	{
		uid: 1,
		username: "djprof",
		firstname: "Dave",
		surname: "Cliff",
		email: "csdtc@bristol.ac.uk",
		newsletter: true,
		premium: false
	}
]

ReactDOM.render(
  <AccountInfo user={dave}/>,
  document.getElementById('accountinfo')
);
