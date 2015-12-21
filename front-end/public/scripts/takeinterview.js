var InterviewApp = React.createClass({
	render: function() {
		return (
			<GetStarted />
		);
	}
});


var GetStarted = React.createClass({
	render: function() {
		return (
			<div>
				<h1 className="orange mpnew">Get Started</h1>

				<section className="white minH">
					<div className="container">

					</div>
				</section>
			</div>
		);
	}
})

ReactDOM.render(
  <InterviewApp />,
  document.getElementById('takeinterview')
);
