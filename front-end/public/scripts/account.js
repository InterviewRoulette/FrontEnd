var AccountInfo = React.createClass({

	comingSoon: function() {
		alert("This feature is coming soon!");
	},

	render: function() {

		return (
			<section className="white minH bluetop">
				<div className="container">
					<h1>Hi James,</h1>
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
			</section>
		);
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
