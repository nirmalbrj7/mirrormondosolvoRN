import React, { useEffect, useState } from 'react';
import FormioComponentsList from '../../FormioComponentsList';
import { StyleSheet } from "react-native";
import { Card } from 'react-native-elements/src/index';
import PropTypes from 'prop-types';
import styles from './styles';
import DynamicTabView from "react-native-dynamic-tab-view";

const Tabs = (props) => {
    const title = (props.component.title && !props.component.hideLabel ? props.component.title : undefined);
    const titleStyle = { ...StyleSheet.flatten(styles.title), color: props.colors.secondaryTextColor };
    const [count, setCount] = useState([]);
    const tabComponent = props.component.components;
    var data = [];
    useEffect(() => {
        tabComponent.map((val, index) => {
            setCount(count => count.concat({
                title: val.label,
                key: Math.round(),
                color: '#000000',
                components: val.components
            }))
        });
    }, []);

    const _renderItem = (item, index) => {
        return (
            <FormioComponentsList style={{ marginTop: 20, padding: 20 }}
                {...props}
                components={item.components}
            ></FormioComponentsList>
        );
    };

    const onChangeTab = index => { };
    return (
        <Card containerStyle={styles.panel} title={title} titleStyle={titleStyle}>
            {
                count.length > 0 ?
                    <DynamicTabView
                        data={count}
                        renderTab={_renderItem}
                        defaultIndex={0}
                        containerStyle={styles.container}
                        headerBackgroundColor={'white'}
                        headerTextStyle={styles.headerText}
                        onChangeTab={onChangeTab}
                        headerUnderlayColor={'blue'}
                    />
                    :
                    null
            }

        </Card>
    );
};

Tabs.propTypes = {
    component: PropTypes.object,
    theme: PropTypes.object,
    colors: PropTypes.object
};

export default Tabs;
