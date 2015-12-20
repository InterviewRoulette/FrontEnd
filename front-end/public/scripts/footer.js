var Footer = React.createClass({
	render: function() {
		return (
			<footer>
				<div className="container textRight">
					<div className="button getstarted button_dark">Get Started</div>
				</div>
			</footer>
		);
	}
});

ReactDOM.render(
  <Footer />,
  document.getElementById('footer')
);