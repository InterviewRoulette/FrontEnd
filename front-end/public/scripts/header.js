var Header = React.createClass({
	render: function() {
		return (
			<header>
				<div className="container">
					<a href="index.html"><div className="logo">
						<img src="images/logo.png" />
					</div></a>

					<div className="nav">
						<a className="hyperlink navlink" href="interviews.html">interviews</a>
						<a className="hyperlink navlink" href="account.html">account center</a>
						<div className="ml10 button getstarted">Get Started</div>
					</div>
				</div>
			</header>
		);
	}
});

ReactDOM.render(
  <Header />,
  document.getElementById('header')
);
